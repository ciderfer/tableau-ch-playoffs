const NHL_SCHEDULE_URL = "https://api-web.nhle.com/v1/club-schedule-season/MTL/now";
const NHL_STANDINGS_URL = "https://api-web.nhle.com/v1/standings/now";

exports.handler = async () => {
  try {
    const [schedule, standings] = await Promise.all([
      fetchJson(NHL_SCHEDULE_URL),
      fetchJson(NHL_STANDINGS_URL)
    ]);

    const payload = buildPayload(schedule, standings);

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

function buildPayload(schedule, standings) {
  const rawGames = Array.isArray(schedule?.games) ? schedule.games : [];
  const playoffGames = rawGames.filter((game) => game.gameType === 3 || game.gameType === 4);
  const games = (playoffGames.length ? playoffGames : rawGames.slice(-7)).slice(-7);
  const nextGame = games.find((game) => !isFinal(game)) || games.at(-1);
  const mtl = findStanding(standings, "MTL");
  const opponentCode = nextGame ? opponentFor(nextGame, "MTL") : "BUF";
  const opponent = findStanding(standings, opponentCode);

  return {
    source: "live",
    lastUpdated: new Date().toISOString(),
    headline: nextGame ? statusText(nextGame) : "Calendrier NHL",
    seriesScore: seriesScore(games, "MTL", opponentCode),
    nextPuck: nextGame ? gameDetail(nextGame) : "À confirmer",
    mtlRecord: recordText(mtl),
    opponentRecord: recordText(opponent),
    mtlLogo: teamLogo(nextGame, "MTL") || "https://assets.nhle.com/logos/nhl/svg/MTL_light.svg",
    opponentLogo: nextGame ? opponentLogoFor(nextGame, "MTL") : "https://assets.nhle.com/logos/nhl/svg/BUF_light.svg",
    games: games.map(toScheduleRow)
  };
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
