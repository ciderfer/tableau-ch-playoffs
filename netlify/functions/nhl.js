const { createHash } = require("crypto");

const NHL_SCHEDULE_URL = "https://api-web.nhle.com/v1/club-schedule-season/MTL/now";
const NHL_STANDINGS_URL = "https://api-web.nhle.com/v1/standings/now";
const NHL_BASE_URL = "https://api-web.nhle.com/v1";
const NHL_STATS_BASE_URL = "https://api.nhle.com/stats/rest/en";
const NHL_LINEUPS_URL = "https://www.nhl.com/news/nhl-lineup-projections-2025-26-season";
const CACHE_CONTROL = "public, max-age=15, stale-while-revalidate=60";

exports.handler = async (event) => {
  try {
    const [schedule, standings] = await Promise.all([
      fetchJson(NHL_SCHEDULE_URL),
      fetchJson(NHL_STANDINGS_URL).catch(() => null)
    ]);

    const payload = await buildPayload(schedule, standings);
    const body = JSON.stringify(payload);
    const etag = `"${createHash("sha256").update(body).digest("hex").slice(0, 16)}"`;
    const requestEtag = readHeader(event, "if-none-match");

    if (requestEtag && requestEtag === etag) {
      return {
        statusCode: 304,
        headers: {
          ETag: etag,
          "Cache-Control": CACHE_CONTROL
        }
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": CACHE_CONTROL
      },
      body
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Impossible de joindre les données NHL pour le moment.",
        detail: error.message
      })
    };
  }
};

function readHeader(event, name) {
  const headers = event?.headers || {};
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Tableau-CH/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json();
}

async function buildPayload(schedule, standings) {
  const rawGames = Array.isArray(schedule?.games) ? schedule.games : [];
  const playoffGames = rawGames.filter((game) => game.gameType === 3 || game.gameType === 4);
  const games = (playoffGames.length ? playoffGames : rawGames.slice(-7)).slice(-7);
  const nextGame = games.find((game) => !isFinal(game)) || games.at(-1);
  const mtl = findStanding(standings, "MTL");
  const opponentCode = nextGame ? opponentFor(nextGame, "MTL") : "BUF";
  const opponent = findStanding(standings, opponentCode);
  const focusGame = pickFocusGame(games);
  const playoffYear = currentPlayoffYear();
  const seasonId = schedule?.currentSeason || schedule?.previousSeason || 20252026;
  const [focusDetails, bracket, specialTeamsByCode] = await Promise.all([
    focusGame ? fetchGameDetails(focusGame).catch(() => null) : Promise.resolve(null),
    fetchPlayoffBracket(playoffYear).catch(() => null),
    fetchSpecialTeams(seasonId).catch(() => null)
  ]);

  const portrait = buildPortrait({
    mtlStanding: mtl,
    opponentStanding: opponent,
    opponentCode,
    rawGames,
    specialTeamsByName: specialTeamsByCode
  });

  return enrichPayload({
    source: "live",
    lastUpdated: new Date().toISOString(),
    headline: nextGame ? statusText(nextGame) : "Calendrier NHL",
    seriesScore: seriesScore(games, "MTL", opponentCode),
    nextPuck: nextGame ? gameDetail(nextGame) : "À confirmer",
    gameStatus: nextGame ? gameStatus(nextGame) : null,
    mtlRecord: recordText(mtl),
    opponentRecord: recordText(opponent),
    mtlLogo: teamLogo(nextGame, "MTL") || "https://assets.nhle.com/logos/nhl/svg/MTL_light.svg",
    opponentLogo: nextGame ? opponentLogoFor(nextGame, "MTL") : "https://assets.nhle.com/logos/nhl/svg/BUF_light.svg",
    games: games.map(toScheduleRow),
    periodScores: focusDetails?.periodScores || null,
    recentGoals: focusDetails?.recentGoals || null,
    focusContext: focusDetails?.context || null,
    bracket,
    portrait
  }, mtl, opponent, opponentCode);
}

async function fetchSpecialTeams(seasonId) {
  const cayenne = `seasonId=${seasonId} and gameTypeId=2`;
  const [pp, pk] = await Promise.all([
    fetchJson(`${NHL_STATS_BASE_URL}/team/powerplay?cayenneExp=${encodeURIComponent(cayenne)}`),
    fetchJson(`${NHL_STATS_BASE_URL}/team/penaltykill?cayenneExp=${encodeURIComponent(cayenne)}`)
  ]);
  // Standings does not expose teamId, so we key by teamFullName which both
  // standings (teamName.default) and the stats API (teamFullName) share.
  const byName = new Map();
  for (const row of (pp?.data || [])) {
    if (!row?.teamFullName) continue;
    byName.set(row.teamFullName, { ...byName.get(row.teamFullName), pp: row.powerPlayPct });
  }
  for (const row of (pk?.data || [])) {
    if (!row?.teamFullName) continue;
    byName.set(row.teamFullName, { ...byName.get(row.teamFullName), pk: row.penaltyKillPct });
  }
  return byName;
}

function buildPortrait({ mtlStanding, opponentStanding, opponentCode, rawGames, specialTeamsByName }) {
  if (!mtlStanding && !opponentStanding) return null;

  const cards = [];

  // L10 record + goal differential
  if (mtlStanding && opponentStanding) {
    cards.push({
      key: "l10",
      label: "10 derniers matchs",
      mtl: {
        primary: `${mtlStanding.l10Wins ?? 0}-${mtlStanding.l10Losses ?? 0}-${mtlStanding.l10OtLosses ?? 0}`,
        secondary: `Diff. buts ${formatSignedInt(mtlStanding.l10GoalDifferential ?? 0)}`,
        score: (mtlStanding.l10Points ?? 0) / Math.max(1, (mtlStanding.l10GamesPlayed ?? 10) * 2)
      },
      opp: {
        primary: `${opponentStanding.l10Wins ?? 0}-${opponentStanding.l10Losses ?? 0}-${opponentStanding.l10OtLosses ?? 0}`,
        secondary: `Diff. buts ${formatSignedInt(opponentStanding.l10GoalDifferential ?? 0)}`,
        score: (opponentStanding.l10Points ?? 0) / Math.max(1, (opponentStanding.l10GamesPlayed ?? 10) * 2)
      },
      higherIsBetter: true
    });
  }

  // Power play %
  const mtlSt = specialTeamsByName?.get(mtlStanding?.teamName?.default);
  const oppSt = specialTeamsByName?.get(opponentStanding?.teamName?.default);
  if (Number.isFinite(mtlSt?.pp) && Number.isFinite(oppSt?.pp)) {
    cards.push({
      key: "pp",
      label: "Avantage numérique",
      mtl: { primary: formatTeamPct(mtlSt.pp), secondary: "Saison régulière", score: mtlSt.pp },
      opp: { primary: formatTeamPct(oppSt.pp), secondary: "Saison régulière", score: oppSt.pp },
      higherIsBetter: true
    });
  }

  // Penalty kill %
  if (Number.isFinite(mtlSt?.pk) && Number.isFinite(oppSt?.pk)) {
    cards.push({
      key: "pk",
      label: "Désavantage numérique",
      mtl: { primary: formatTeamPct(mtlSt.pk), secondary: "Saison régulière", score: mtlSt.pk },
      opp: { primary: formatTeamPct(oppSt.pk), secondary: "Saison régulière", score: oppSt.pk },
      higherIsBetter: true
    });
  }

  // Head-to-head regular season
  const h2h = computeH2H(rawGames, "MTL", opponentCode);
  if (h2h && h2h.totalGames > 0) {
    cards.push({
      key: "h2h",
      label: `Saison rég. vs ${opponentCode}`,
      mtl: {
        primary: `${h2h.mtlWins}-${h2h.oppWins}`,
        secondary: `Buts ${h2h.mtlGoals}-${h2h.oppGoals}`,
        score: h2h.totalGames > 0 ? h2h.mtlWins / h2h.totalGames : 0.5
      },
      opp: {
        primary: `${h2h.oppWins}-${h2h.mtlWins}`,
        secondary: `Buts ${h2h.oppGoals}-${h2h.mtlGoals}`,
        score: h2h.totalGames > 0 ? h2h.oppWins / h2h.totalGames : 0.5
      },
      higherIsBetter: true
    });
  }

  if (!cards.length) return null;

  return {
    cards,
    opponentCode,
    mtlStreak: streakLabel(mtlStanding),
    opponentStreak: streakLabel(opponentStanding)
  };
}

function computeH2H(rawGames, teamCode, opponentCode) {
  if (!Array.isArray(rawGames) || !opponentCode) return null;
  const regularSeasonGames = rawGames.filter((game) => {
    if (game.gameType !== 2) return false; // 2 = regular season
    const away = game.awayTeam?.abbrev;
    const home = game.homeTeam?.abbrev;
    return (away === teamCode && home === opponentCode) || (home === teamCode && away === opponentCode);
  });

  let mtlWins = 0;
  let oppWins = 0;
  let mtlGoals = 0;
  let oppGoals = 0;
  let totalGames = 0;

  for (const game of regularSeasonGames) {
    if (!isFinal(game)) continue;
    const away = game.awayTeam || {};
    const home = game.homeTeam || {};
    if (!Number.isInteger(away.score) || !Number.isInteger(home.score)) continue;

    totalGames += 1;
    const teamIsAway = away.abbrev === teamCode;
    const teamScore = teamIsAway ? away.score : home.score;
    const oppScore = teamIsAway ? home.score : away.score;
    mtlGoals += teamScore;
    oppGoals += oppScore;
    if (teamScore > oppScore) mtlWins += 1;
    else oppWins += 1;
  }

  return { mtlWins, oppWins, mtlGoals, oppGoals, totalGames };
}

function streakLabel(standing) {
  if (!standing?.streakCode || !Number.isFinite(standing.streakCount)) return null;
  const code = standing.streakCode;
  const count = standing.streakCount;
  const labels = { W: "victoires", L: "défaites", OT: "défaites en prolongation" };
  return `${count} ${labels[code] || code.toLowerCase()}`;
}

function formatTeamPct(value) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedInt(value) {
  if (!Number.isFinite(value)) return "—";
  return value > 0 ? `+${value}` : String(value);
}

function currentPlayoffYear() {
  const now = new Date();
  // Playoffs run April–June each year. Before April we point at the previous run.
  return now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

async function fetchPlayoffBracket(year) {
  const data = await fetchJson(`${NHL_BASE_URL}/playoff-bracket/${year}`);
  return buildBracket(data);
}

const BRACKET_FEEDERS = {
  I: ["A", "B"],
  J: ["C", "D"],
  K: ["E", "F"],
  L: ["G", "H"],
  M: ["I", "J"],
  N: ["K", "L"],
  O: ["M", "N"]
};

function buildBracket(raw) {
  if (!raw || !Array.isArray(raw.series)) return null;
  const byLetter = Object.fromEntries(raw.series.map((s) => [s.seriesLetter, s]));

  const r1Letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const mtlR1Letter = r1Letters.find((letter) => isMtlInSeries(byLetter[letter]));
  if (!mtlR1Letter) return null;

  const nextLetter = {};
  for (const [next, [a, b]] of Object.entries(BRACKET_FEEDERS)) {
    nextLetter[a] = next;
    nextLetter[b] = next;
  }

  const path = [mtlR1Letter];
  let cur = mtlR1Letter;
  while (nextLetter[cur]) {
    cur = nextLetter[cur];
    path.push(cur);
  }
  const pathSet = new Set(path);

  let mtlEliminatedAtRound = null;
  const rounds = path.map((letter, idx) => {
    const round = idx + 1;
    const series = byLetter[letter] || null;
    const card = formatBracketRound(round, letter, series, byLetter, pathSet, mtlEliminatedAtRound !== null);
    if (card.outcome === "lost") {
      mtlEliminatedAtRound = round;
    }
    return card;
  });

  return { rounds };
}

function gatherTeamsFromBranch(letter, byLetter) {
  const s = byLetter[letter];
  if (!s) return [];
  const teams = [];
  if (s.topSeedTeam?.abbrev) teams.push(s.topSeedTeam.abbrev);
  if (s.bottomSeedTeam?.abbrev) teams.push(s.bottomSeedTeam.abbrev);
  if (teams.length) return teams;
  const feeders = BRACKET_FEEDERS[letter];
  if (!feeders) return [];
  return feeders.flatMap((f) => gatherTeamsFromBranch(f, byLetter));
}

function formatBracketRound(round, letter, series, byLetter, pathSet, alreadyEliminated) {
  const card = {
    round,
    label: roundLongLabel(round),
    seriesLetter: letter,
    state: "tbd",
    outcome: null,
    description: ""
  };

  if (alreadyEliminated) {
    card.description = "MTL éliminé";
    return card;
  }

  if (!series) {
    card.description = "Série à venir";
    return card;
  }

  const mtlInSeries = isMtlInSeries(series);
  const totalGames = (series.topSeedWins || 0) + (series.bottomSeedWins || 0);
  const completed = Number.isInteger(series.winningTeamId) && series.winningTeamId !== 0;
  const inProgress = !completed && totalGames > 0;

  card.state = completed ? "completed" : inProgress ? "in-progress" : "tbd";

  if (mtlInSeries) {
    const mtlIsTopSeed = series.topSeedTeam?.abbrev === "MTL";
    const opponent = mtlIsTopSeed ? series.bottomSeedTeam : series.topSeedTeam;
    const mtlWins = mtlIsTopSeed ? series.topSeedWins : series.bottomSeedWins;
    const oppWins = mtlIsTopSeed ? series.bottomSeedWins : series.topSeedWins;
    const mtlId = mtlIsTopSeed ? series.topSeedTeam?.id : series.bottomSeedTeam?.id;

    card.matchup = {
      mtlWins: mtlWins || 0,
      oppWins: oppWins || 0,
      opponentCode: opponent?.abbrev || "?",
      opponentName: opponent?.commonName?.default || opponent?.name?.default || opponent?.abbrev || "?",
      opponentLogo: opponent?.logo || ""
    };

    if (completed) {
      card.outcome = series.winningTeamId === mtlId ? "won" : "lost";
      card.description = card.outcome === "won"
        ? `Série gagnée ${mtlWins}-${oppWins}`
        : `Éliminé ${mtlWins}-${oppWins}`;
    } else if (inProgress) {
      const lead = (mtlWins || 0) - (oppWins || 0);
      card.description = lead > 0
        ? `MTL devant ${mtlWins}-${oppWins}`
        : lead < 0
          ? `MTL en arrière ${mtlWins}-${oppWins}`
          : `Égalité ${mtlWins}-${oppWins}`;
    } else {
      card.description = "Série à venir";
    }
    return card;
  }

  // MTL not yet in this series — look at the OTHER branch only.
  const otherFeeders = (BRACKET_FEEDERS[letter] || []).filter((f) => !pathSet.has(f));
  const possibleOpponents = new Set();
  for (const feederLetter of otherFeeders) {
    for (const team of gatherTeamsFromBranch(feederLetter, byLetter)) {
      possibleOpponents.add(team);
    }
  }
  possibleOpponents.delete("MTL");

  card.matchup = null;
  if (possibleOpponents.size === 0) {
    card.description = round === 4 ? "Champion de l'Ouest à déterminer" : "Adversaire à déterminer";
  } else {
    const list = [...possibleOpponents].slice(0, 4).join(" / ");
    card.description = `Si MTL avance: vs ${list}`;
  }
  return card;
}

function isMtlInSeries(series) {
  if (!series) return false;
  return series.topSeedTeam?.abbrev === "MTL" || series.bottomSeedTeam?.abbrev === "MTL";
}

function roundLongLabel(round) {
  if (round === 1) return "Ronde 1";
  if (round === 2) return "Ronde 2";
  if (round === 3) return "Finale d'association";
  return "Finale de la Coupe Stanley";
}

function roundShortLabel(round) {
  if (round === 1) return "R1";
  if (round === 2) return "R2";
  if (round === 3) return "finale d'association";
  return "finale de la Coupe";
}

function pickFocusGame(games) {
  const live = games.find((game) => game.gameState === "LIVE" || game.gameState === "CRIT");
  if (live) return live;
  return [...games].reverse().find(isFinal) || null;
}

async function fetchGameDetails(game) {
  const id = game.id || game.gamePk;
  if (!id) return null;

  const isLive = game.gameState === "LIVE" || game.gameState === "CRIT";
  const [landing, playByPlay] = await Promise.all([
    fetchJson(`${NHL_BASE_URL}/gamecenter/${id}/landing`),
    isLive ? fetchJson(`${NHL_BASE_URL}/gamecenter/${id}/play-by-play`).catch(() => null) : Promise.resolve(null)
  ]);
  const summary = landing?.summary || {};
  const linescore = summary.linescore || {};
  const byPeriod = Array.isArray(linescore.byPeriod) ? linescore.byPeriod : [];
  const shotsByPeriod = Array.isArray(linescore.shotsByPeriod) ? linescore.shotsByPeriod : [];
  const totalShotsAway = shotsByPeriod.reduce((sum, row) => sum + (Number.isInteger(row.away) ? row.away : 0), 0);
  const totalShotsHome = shotsByPeriod.reduce((sum, row) => sum + (Number.isInteger(row.home) ? row.home : 0), 0);
  const periodScores = {
    awayCode: landing?.awayTeam?.abbrev || game.awayTeam?.abbrev || "VIS",
    homeCode: landing?.homeTeam?.abbrev || game.homeTeam?.abbrev || "DOM",
    rows: byPeriod.map((row) => ({
      label: periodLabel(row.periodDescriptor),
      away: Number.isInteger(row.away) ? row.away : 0,
      home: Number.isInteger(row.home) ? row.home : 0
    })),
    totalAway: linescore.totals?.away ?? landing?.awayTeam?.score ?? 0,
    totalHome: linescore.totals?.home ?? landing?.homeTeam?.score ?? 0,
    shotRows: shotsByPeriod.length ? shotsByPeriod.map((row) => ({
      label: periodLabel(row.periodDescriptor),
      away: Number.isInteger(row.away) ? row.away : 0,
      home: Number.isInteger(row.home) ? row.home : 0
    })) : null,
    totalShotsAway: shotsByPeriod.length ? totalShotsAway : null,
    totalShotsHome: shotsByPeriod.length ? totalShotsHome : null
  };

  const scoring = Array.isArray(summary.scoring) ? summary.scoring : [];
  const flatGoals = scoring.flatMap((period) => {
    const goals = Array.isArray(period.goals) ? period.goals : [];
    return goals.map((goal) => ({
      period: periodLabel(period.periodDescriptor),
      periodNumber: period.periodDescriptor?.number ?? null,
      periodType: period.periodDescriptor?.periodType ?? null,
      time: goal.timeInPeriod || "",
      team: goal.teamAbbrev?.default || "",
      scorer: [goal.firstName?.default, goal.lastName?.default].filter(Boolean).join(" "),
      assists: (goal.assists || []).map((assist) => [assist.firstName?.default, assist.lastName?.default].filter(Boolean).join(" ")).filter(Boolean),
      strength: (goal.strength || "ev").toUpperCase(),
      awayScore: Number.isInteger(goal.awayScore) ? goal.awayScore : null,
      homeScore: Number.isInteger(goal.homeScore) ? goal.homeScore : null
    }));
  });

  const recentGoals = flatGoals.reverse();
  const currentPeriodDescriptor = game.periodDescriptor || landing?.periodDescriptor || null;
  const strengthState = isLive && playByPlay ? readStrengthState(playByPlay) : null;

  return {
    periodScores: periodScores.rows.length ? periodScores : null,
    recentGoals: recentGoals.length ? recentGoals : null,
    context: {
      isLive,
      isFinal: isFinal(game),
      label: game.seriesGameNumber ? `Match ${game.seriesGameNumber}` : "Match",
      currentPeriod: currentPeriodDescriptor ? {
        number: currentPeriodDescriptor.number ?? null,
        type: currentPeriodDescriptor.periodType ?? null,
        label: periodLabel(currentPeriodDescriptor)
      } : null,
      strengthState
    }
  };
}

function readStrengthState(playByPlay) {
  const plays = Array.isArray(playByPlay?.plays) ? playByPlay.plays : [];
  if (!plays.length) return null;

  let latest = null;
  for (let i = plays.length - 1; i >= 0; i--) {
    const code = plays[i]?.situationCode;
    if (typeof code === "string" && code.length === 4) {
      latest = plays[i];
      break;
    }
  }
  if (!latest) return null;

  const code = latest.situationCode;
  const awaySkaters = parseInt(code[1], 10);
  const homeSkaters = parseInt(code[2], 10);
  if (!Number.isInteger(awaySkaters) || !Number.isInteger(homeSkaters)) return null;

  const awayCode = playByPlay.awayTeam?.abbrev || "VIS";
  const homeCode = playByPlay.homeTeam?.abbrev || "DOM";

  if (awaySkaters === homeSkaters) {
    // Even strength (5v5, or oddities like 4v4 / 3v3 in OT)
    return {
      awaySkaters,
      homeSkaters,
      awayCode,
      homeCode,
      isPowerPlay: false
    };
  }

  return {
    awaySkaters,
    homeSkaters,
    awayCode,
    homeCode,
    isPowerPlay: true,
    advantageTeam: awaySkaters > homeSkaters ? awayCode : homeCode,
    shorthandedTeam: awaySkaters < homeSkaters ? awayCode : homeCode
  };
}

function periodLabel(descriptor) {
  if (!descriptor) return "";
  const number = descriptor.number;
  const type = descriptor.periodType;
  if (type === "OT") return "Pr.";
  if (type === "SO") return "TB";
  if (number === 1) return "1re";
  if (number === 2) return "2e";
  if (number === 3) return "3e";
  if (number > 3) return `Pr.${number - 3}`;
  return String(number || "");
}

async function enrichPayload(payload, mtlStanding, opponentStanding, opponentCode) {
  const [mtlStats, opponentStats, mtlRoster, opponentRoster, editorialLineups] = await Promise.all([
    fetchJson(`${NHL_BASE_URL}/club-stats/MTL/now`).catch(() => null),
    opponentCode ? fetchJson(`${NHL_BASE_URL}/club-stats/${opponentCode}/now`).catch(() => null) : Promise.resolve(null),
    fetchJson(`${NHL_BASE_URL}/roster/MTL/current`).catch(() => null),
    opponentCode ? fetchJson(`${NHL_BASE_URL}/roster/${opponentCode}/current`).catch(() => null) : Promise.resolve(null),
    fetchEditorialLineups(opponentStanding?.teamCommonName?.default || opponentCode, opponentCode).catch(() => null)
  ]);

  return {
    ...payload,
    leaders: [
      leaderGroup("MTL", mtlStats),
      leaderGroup(opponentCode, opponentStats)
    ],
    lineups: [
      editorialLineups?.MTL || projectedLineup("MTL", mtlRoster, mtlStats),
      editorialLineups?.opponent || projectedLineup(opponentCode, opponentRoster, opponentStats)
    ]
  };
}

async function fetchEditorialLineups(opponentName, opponentCode) {
  const response = await fetch(NHL_LINEUPS_URL, {
    headers: { "User-Agent": "Tableau-CH/1.0" }
  });

  if (!response.ok) {
    throw new Error(`NHL lineup page returned ${response.status}`);
  }

  const text = normalizeArticle(await response.text());
  const mtl = parseEditorialLineup(text, "Canadiens", opponentName);
  const opponent = parseEditorialLineup(text, opponentName, "Status report");

  if (!mtl || !opponent) {
    throw new Error("Projected lineups not found in NHL.com article");
  }

  return {
    MTL: { team: "MTL", status: "Projection NHL.com", ...mtl },
    opponent: { team: opponentCode, status: "Projection NHL.com", ...opponent }
  };
}

function normalizeArticle(html) {
  return html
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r/g, "");
}

function parseEditorialLineup(text, teamName, nextMarker) {
  const heading = `${teamName} projected lineup`;
  const start = text.indexOf(heading);

  if (start < 0) {
    return null;
  }

  const nextLineup = text.indexOf(`${nextMarker} projected lineup`, start + heading.length);
  const statusReport = text.indexOf("Status report", start + heading.length);
  const endCandidates = [nextLineup, statusReport].filter((index) => index > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : start + 1800;
  const lines = text
    .slice(start, end)
    .split(/\n+/)
    .map(cleanArticleLine)
    .filter(Boolean);

  const hockeyLines = lines
    .filter((line) => !line.toLowerCase().includes("projected lineup"))
    .filter((line) => !/^(scratched|injured|status report)/i.test(line));

  const forwards = hockeyLines
    .filter((line) => line.includes("--"))
    .map((line) => line.split(/\s+--\s+/).map((player) => player.trim()))
    .filter((line) => line.length === 3)
    .slice(0, 4)
    .map((line, index) => [`L${index + 1}`, ...line]);

  const defense = hockeyLines
    .filter((line) => line.includes("--"))
    .map((line) => line.split(/\s+--\s+/).map((player) => player.trim()))
    .filter((line) => line.length === 2)
    .slice(0, 3)
    .map((line, index) => [`D${index + 1}`, ...line]);

  const goalieStartIndex = hockeyLines.findIndex((line) => line.includes("--") && line.split(/\s+--\s+/).length === 2) + 3;
  const goalies = hockeyLines
    .slice(Math.max(goalieStartIndex, 0))
    .filter((line) => !line.includes("--"))
    .slice(0, 2);

  if (!forwards.length || !defense.length || !goalies.length) {
    return null;
  }

  return { forwards, defense, goalies };
}

function cleanArticleLine(line) {
  return line
    .replace(/[*_`]/g, "")
    .replace(/\\u2013|\\u2014/g, "--")
    .replace(/[–—]/g, "--")
    .replace(/\s+/g, " ")
    .trim();
}

function findStanding(standings, teamCode) {
  const rows = Array.isArray(standings?.standings) ? standings.standings : [];
  return rows.find((row) => row.teamAbbrev?.default === teamCode);
}

function recordText(row) {
  if (!row) {
    return "fiche à jour";
  }

  return `${row.wins}-${row.losses}-${row.otLosses}`;
}

function leaderGroup(team, stats) {
  const skaters = [...(stats?.skaters || [])]
    .sort((a, b) => b.points - a.points || b.goals - a.goals || b.shots - a.shots)
    .slice(0, 4)
    .map((player) => ({
      name: playerName(player),
      meta: `${player.positionCode} · ${player.goals}B ${player.assists}A`,
      stat: `${player.points} pts`,
      headshot: player.headshot
    }));

  const goalies = [...(stats?.goalies || [])]
    .sort((a, b) => b.gamesStarted - a.gamesStarted || b.wins - a.wins)
    .slice(0, 1)
    .map((player) => ({
      name: playerName(player),
      meta: `${player.wins}-${player.losses}${player.overtimeLosses ? `-${player.overtimeLosses}` : ""}`,
      stat: `${pct(player.savePercentage)} SV%`,
      headshot: player.headshot
    }));

  return { team, skaters, goalies };
}

function projectedLineup(team, roster, stats) {
  const ranked = rankRoster(roster, stats);
  const forwardsPool = ranked.forwards.slice(0, 14);

  const forwards = [0, 1, 2, 3].map((index) => [
    `L${index + 1}`,
    compactName(takeForward(forwardsPool, "L")),
    compactName(takeForward(forwardsPool, "C")),
    compactName(takeForward(forwardsPool, "R"))
  ]);

  const defense = [0, 1, 2].map((index) => [
    `D${index + 1}`,
    compactName(ranked.defensemen[index * 2]),
    compactName(ranked.defensemen[index * 2 + 1])
  ]);

  return {
    team,
    status: "Projection",
    forwards,
    defense,
    goalies: ranked.goalies.slice(0, 2).map(compactName)
  };
}

function rankRoster(roster, stats) {
  const scoreById = new Map((stats?.skaters || []).map((player) => [
    player.playerId,
    player.points * 100 + player.goals * 10 + player.shots
  ]));
  const goalieScoreById = new Map((stats?.goalies || []).map((player) => [
    player.playerId,
    player.gamesStarted * 100 + player.wins * 20 + Math.round((player.savePercentage || 0) * 100)
  ]));

  return {
    forwards: sortRoster(roster?.forwards || [], scoreById),
    defensemen: sortRoster(roster?.defensemen || [], scoreById),
    goalies: sortRoster(roster?.goalies || [], goalieScoreById)
  };
}

function sortRoster(players, scoreById) {
  return [...players].sort((a, b) => (scoreById.get(b.id) || 0) - (scoreById.get(a.id) || 0) || (a.sweaterNumber || 99) - (b.sweaterNumber || 99));
}

function takeForward(pool, position) {
  const index = pool.findIndex((player) => player.positionCode === position);
  const playerIndex = index >= 0 ? index : 0;
  const [player] = pool.splice(playerIndex, 1);
  return player;
}

function playerName(player) {
  return `${player?.firstName?.default || ""} ${player?.lastName?.default || ""}`.trim();
}

function compactName(player) {
  const name = playerName(player);
  return name || "À confirmer";
}

function pct(value) {
  return Number.isFinite(value) ? value.toFixed(3).replace(/^0\./, ".") : "—";
}

function opponentFor(game, teamCode) {
  const away = game.awayTeam?.abbrev;
  const home = game.homeTeam?.abbrev;
  return away === teamCode ? home : away;
}

function seriesScore(games, teamCode, opponentCode) {
  const finished = games.filter(isFinal);
  let teamWins = 0;
  let opponentWins = 0;

  for (const game of finished) {
    const away = game.awayTeam;
    const home = game.homeTeam;

    if (!Number.isInteger(away?.score) || !Number.isInteger(home?.score)) {
      continue;
    }

    const winner = away.score > home.score ? away.abbrev : home.abbrev;

    if (winner === teamCode) {
      teamWins += 1;
    } else if (winner === opponentCode) {
      opponentWins += 1;
    }
  }

  return `${teamWins}-${opponentWins}`;
}

function toScheduleRow(game, index) {
  const live = game.gameState === "LIVE" || game.gameState === "CRIT";
  const done = isFinal(game);
  const isMTLHome = game.homeTeam?.abbrev === "MTL";
  let tag;
  let kind;
  if (live) { tag = "En direct"; kind = "live"; }
  else if (done) { tag = "Final"; kind = "final"; }
  else if (isMTLHome) { tag = "Maison"; kind = "home"; }
  else { tag = "Route"; kind = "away"; }

  return {
    date: shortDate(game.gameDate || game.startTimeUTC),
    label: game.seriesGameNumber ? `Match ${game.seriesGameNumber}` : `Match ${index + 1}`,
    detail: gameDetail(game),
    tag,
    kind,
    state: live ? "live" : done ? "final" : "upcoming"
  };
}

function gameDetail(game) {
  const away = game.awayTeam?.abbrev || "VIS";
  const home = game.homeTeam?.abbrev || "DOM";
  const venue = game.venue?.default || "Aréna à confirmer";
  const time = game.startTimeUTC && game.gameScheduleState !== "TBD" ? shortTime(game.startTimeUTC) : "";
  const score = Number.isInteger(game.awayTeam?.score) && Number.isInteger(game.homeTeam?.score)
    ? ` · ${game.awayTeam.score}-${game.homeTeam.score}`
    : "";

  return `${away} @ ${home} · ${venue}${time ? ` · ${time}` : ""}${score}`;
}

function gameStatus(game) {
  const away = game.awayTeam || {};
  const home = game.homeTeam || {};
  const isLive = game.gameState === "LIVE" || game.gameState === "CRIT";
  const isDone = isFinal(game);
  const clock = game.clock?.timeRemaining || "";
  const period = game.periodDescriptor?.number ? `P${game.periodDescriptor.number}` : "";

  return {
    awayCode: away.abbrev || "VIS",
    homeCode: home.abbrev || "DOM",
    awayScore: Number.isInteger(away.score) ? away.score : 0,
    homeScore: Number.isInteger(home.score) ? home.score : 0,
    state: isLive ? "En direct" : isDone ? "Final" : "Avant-match",
    detail: isLive ? [period, clock].filter(Boolean).join(" · ") : isDone ? "Terminé" : shortTime(game.startTimeUTC),
    isLive,
    startTimeUTC: game.startTimeUTC || null
  };
}

function teamLogo(game, teamCode) {
  if (!game) {
    return "";
  }

  const team = game.awayTeam?.abbrev === teamCode ? game.awayTeam : game.homeTeam;
  return team?.logo || team?.darkLogo || "";
}

function opponentLogoFor(game, teamCode) {
  const opponent = game.awayTeam?.abbrev === teamCode ? game.homeTeam : game.awayTeam;
  return opponent?.logo || opponent?.darkLogo || "";
}

function statusText(game) {
  if (game.gameState === "LIVE" || game.gameState === "CRIT") {
    return "Match en direct";
  }

  if (isFinal(game)) {
    return "Dernier match final";
  }

  return game.seriesGameNumber ? `Match ${game.seriesGameNumber} à venir` : "Prochain match";
}

function shortDate(value) {
  const date = String(value).includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    timeZone: "America/Toronto"
  }).format(date);
}

function shortTime(value) {
  return new Intl.DateTimeFormat("fr-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
    timeZoneName: "short"
  }).format(new Date(value));
}

function isFinal(game) {
  return game.gameState === "OFF" || game.gameState === "FINAL";
}
