const NHL_SCHEDULE_URL = "https://api-web.nhle.com/v1/club-schedule-season/MTL/now";
const NHL_STANDINGS_URL = "https://api-web.nhle.com/v1/standings/now";
const NHL_BASE_URL = "https://api-web.nhle.com/v1";
const NHL_LINEUPS_URL = "https://www.nhl.com/news/nhl-lineup-projections-2025-26-season";

exports.handler = async () => {
  try {
    const [schedule, standings] = await Promise.all([
      fetchJson(NHL_SCHEDULE_URL),
      fetchJson(NHL_STANDINGS_URL)
    ]);

    const payload = await buildPayload(schedule, standings);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      },
      body: JSON.stringify(payload)
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
    games: games.map(toScheduleRow)
  }, mtl, opponent, opponentCode);
}

async function enrichPayload(payload, mtlStanding, opponentStanding, opponentCode) {
  const [mtlStats, opponentStats, mtlRoster, opponentRoster, editorialLineups] = await Promise.all([
    fetchJson(`${NHL_BASE_URL}/club-stats/MTL/now`),
    fetchJson(`${NHL_BASE_URL}/club-stats/${opponentCode}/now`),
    fetchJson(`${NHL_BASE_URL}/roster/MTL/current`),
    fetchJson(`${NHL_BASE_URL}/roster/${opponentCode}/current`),
    fetchEditorialLineups(opponentStanding?.teamCommonName?.default || opponentCode, opponentCode).catch(() => null)
  ]);

  return {
    ...payload,
    teamStats: [
      teamStatsCard("MTL", mtlStanding),
      teamStatsCard(opponentCode, opponentStanding)
    ],
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

function teamStatsCard(code, row) {
  const games = row?.gamesPlayed || 82;
  const goalsFor = row?.goalFor || 0;
  const goalsAgainst = row?.goalAgainst || 0;

  return {
    code,
    name: row?.teamCommonName?.default || code,
    record: recordText(row),
    metrics: [
      { label: "Points", value: String(row?.points ?? "—") },
      { label: "Buts / match", value: decimal(goalsFor / games) },
      { label: "Alloués / match", value: decimal(goalsAgainst / games) },
      { label: "Diff.", value: signed(row?.goalDifferential ?? 0) }
    ]
  };
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

function decimal(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
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
  return {
    date: shortDate(game.gameDate || game.startTimeUTC),
    label: game.seriesGameNumber ? `Match ${game.seriesGameNumber}` : `Match ${index + 1}`,
    detail: gameDetail(game),
    tag: tagFor(game)
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
    isLive
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

function tagFor(game) {
  if (game.gameState === "LIVE" || game.gameState === "CRIT") {
    return "Live";
  }

  if (isFinal(game)) {
    return "Final";
  }

  return "À venir";
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
