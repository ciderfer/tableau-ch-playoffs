const fallbackData = {
  source: "fallback",
  lastUpdated: "Données vérifiées le 6 mai 2026",
  headline: "Match 1 ce soir",
  seriesScore: "0-0",
  gameStatus: {
    awayCode: "MTL",
    homeCode: "BUF",
    awayScore: 0,
    homeScore: 0,
    state: "Avant-match",
    detail: "19 h HE",
    isLive: false,
    startTimeUTC: "2026-05-06T23:00:00Z"
  },
  mtlRecord: "48-24-10",
  opponentRecord: "50-23-9",
  mtlLogo: "https://assets.nhle.com/logos/nhl/svg/MTL_light.svg",
  opponentLogo: "https://assets.nhle.com/logos/nhl/svg/BUF_light.svg",
  teamStats: [
    {
      code: "MTL",
      name: "Canadiens",
      record: "48-24-10",
      metrics: [
        { label: "Points", value: "106" },
        { label: "Buts / match", value: "3.45" },
        { label: "Alloués / match", value: "3.12" },
        { label: "Diff.", value: "+27" }
      ]
    },
    {
      code: "BUF",
      name: "Sabres",
      record: "50-23-9",
      metrics: [
        { label: "Points", value: "109" },
        { label: "Buts / match", value: "3.51" },
        { label: "Alloués / match", value: "2.94" },
        { label: "Diff.", value: "+47" }
      ]
    }
  ],
  leaders: [
    {
      team: "MTL",
      skaters: [
        { name: "Nick Suzuki", meta: "C", stat: "À suivre", headshot: "" },
        { name: "Cole Caufield", meta: "R", stat: "Tirs", headshot: "" }
      ],
      goalies: [{ name: "Jakub Dobes", meta: "G", stat: ".923", headshot: "" }]
    },
    {
      team: "BUF",
      skaters: [
        { name: "Tage Thompson", meta: "C", stat: "Menace", headshot: "" },
        { name: "Rasmus Dahlin", meta: "D", stat: "Relance", headshot: "" }
      ],
      goalies: [{ name: "Alex Lyon", meta: "G", stat: ".955", headshot: "" }]
    }
  ],
  lineups: [
    {
      team: "MTL",
      status: "Projection",
      forwards: [["L1", "Ailier G", "Centre", "Ailier D"], ["L2", "Ailier G", "Centre", "Ailier D"]],
      defense: [["D1", "Défenseur", "Défenseur"], ["D2", "Défenseur", "Défenseur"]],
      goalies: ["Jakub Dobes"]
    },
    {
      team: "BUF",
      status: "Projection",
      forwards: [["L1", "Ailier G", "Centre", "Ailier D"], ["L2", "Ailier G", "Centre", "Ailier D"]],
      defense: [["D1", "Défenseur", "Défenseur"], ["D2", "Défenseur", "Défenseur"]],
      goalies: ["Alex Lyon"]
    }
  ],
  games: [
    { date: "6 mai", label: "Match 1", detail: "MTL @ BUF · KeyBank Center · 19 h HE", tag: "Ce soir", kind: "away" },
    { date: "8 mai", label: "Match 2", detail: "MTL @ BUF · KeyBank Center", tag: "Route", kind: "away" },
    { date: "10 mai", label: "Match 3", detail: "BUF @ MTL · Centre Bell", tag: "Maison", kind: "home" },
    { date: "12 mai", label: "Match 4", detail: "BUF @ MTL · Centre Bell", tag: "Maison", kind: "home" },
    { date: "14 mai", label: "Match 5", detail: "MTL @ BUF · si nécessaire", tag: "Au besoin", kind: "away" },
    { date: "16 mai", label: "Match 6", detail: "BUF @ MTL · si nécessaire", tag: "Au besoin", kind: "home" },
    { date: "18 mai", label: "Match 7", detail: "MTL @ BUF · si nécessaire", tag: "Décisif", kind: "away" }
  ]
};

const $ = (selector) => document.querySelector(selector);

const els = {
  scheduleList: $("#scheduleList"),
  noteForm: $("#noteForm"),
  noteInput: $("#noteInput"),
  notesList: $("#notesList"),
  notesMeta: $("#notesMeta"),
  copyNotes: $("#copyNotes"),
  clearNotes: $("#clearNotes"),
  themeToggle: $("#themeToggle"),
  themeLabel: document.querySelector("#themeToggle .theme-label"),
  alertsToggle: $("#alertsToggle"),
  navToggle: $("#navToggle"),
  primaryNav: $("#primaryNav"),
  dataStatus: $("#dataStatus"),
  scoreMeta: document.querySelector(".score-meta"),
  lastUpdated: $("#lastUpdated"),
  scoreboardHeadline: $("#scoreboardHeadline"),
  seriesScore: $("#seriesScore"),
  mtlRecord: $("#mtlRecord"),
  opponentRecord: $("#opponentRecord"),
  mtlLogo: $("#mtlLogo"),
  opponentLogo: $("#opponentLogo"),
  awayCode: $("#awayCode"),
  homeCode: $("#homeCode"),
  awayScore: $("#awayScore"),
  homeScore: $("#homeScore"),
  gameState: $("#gameState"),
  gameClock: $("#gameClock"),
  liveScoreCard: $("#liveScoreCard"),
  teamStatsGrid: $("#teamStatsGrid"),
  leaderGrid: $("#leaderGrid"),
  lineupGrid: $("#lineupGrid"),
  lineupStatus: $("#lineupStatus"),
  lineupUpdated: $("#lineupUpdated"),
  miniScore: $("#miniScore"),
  miniAwayCode: $("#miniAwayCode"),
  miniHomeCode: $("#miniHomeCode"),
  miniAwayScore: $("#miniAwayScore"),
  miniHomeScore: $("#miniHomeScore"),
  miniState: $("#miniState"),
  countdown: $("#puckCountdown"),
  cdDays: $("#cdDays"),
  cdHours: $("#cdHours"),
  cdMinutes: $("#cdMinutes"),
  cdSeconds: $("#cdSeconds"),
  periodTable: $("#periodTable"),
  periodHeader: $("#periodHeader"),
  periodBody: $("#periodBody"),
  strengthBar: $("#strengthBar"),
  strengthLabel: $("#strengthLabel"),
  strengthDetail: $("#strengthDetail"),
  periodShotsBody: $("#periodShotsBody"),
  goalFeed: $("#goals"),
  goalList: $("#goalList"),
  goalFeedEyebrow: $("#goalFeedEyebrow"),
  goalFeedStatus: $("#goalFeedStatus"),
  bracketSection: $("#bracket"),
  bracketRounds: $("#bracketRounds")
};

const STORAGE_KEY_NOTES = "tableau-ch-notes";
const STORAGE_KEY_THEME = "tableau-ch-theme";
const STORAGE_KEY_ALERTS = "tableau-ch-alerts";
const MAX_NOTES = 50;

const POLL_LIVE_MS = 15_000;
const POLL_KICKOFF_SOON_MS = 30_000;
const POLL_DEFAULT_MS = 60_000;
const POLL_IDLE_MS = 5 * 60_000;
const STALE_AFTER_MS = 90_000;
const BROKEN_AFTER_MS = 5 * 60_000;

let pollTimer = null;
let inflightController = null;
let countdownTimer = null;
let lastStatus = null;
let lastEtag = null;
let lastData = null;
let lastSuccessAt = Date.now();
let hasRenderedOnce = false;
let freshnessTimer = null;

// ---------------------- Data fetching ----------------------

async function fetchLiveData() {
  if (inflightController) {
    inflightController.abort();
  }

  inflightController = new AbortController();
  const { signal } = inflightController;

  const endpoints = [
    { url: "/.netlify/functions/nhl", normalize: normalizeFunctionData, useEtag: true },
    { url: "https://api-web.nhle.com/v1/club-schedule-season/MTL/now", normalize: normalizeScheduleData, useEtag: false }
  ];

  for (const endpoint of endpoints) {
    try {
      const headers = endpoint.useEtag && lastEtag ? { "If-None-Match": lastEtag } : undefined;
      const response = await fetch(endpoint.url, { cache: "no-store", signal, headers });

      if (response.status === 304) {
        return { __unchanged: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (endpoint.useEtag) {
        const newEtag = response.headers.get("ETag");
        if (newEtag) lastEtag = newEtag;
      }

      const payload = await response.json();
      return endpoint.normalize(payload);
    } catch (error) {
      if (error.name === "AbortError") {
        return null;
      }
      continue;
    }
  }

  return { __failed: true };
}

function normalizeFunctionData(payload) {
  if (!payload || !Array.isArray(payload.games)) {
    return fallbackData;
  }

  return {
    ...fallbackData,
    ...payload,
    source: "live",
    lastUpdated: payload.lastUpdated?.includes?.("T")
      ? `Mis à jour ${formatTimestamp(new Date(payload.lastUpdated))}`
      : payload.lastUpdated || fallbackData.lastUpdated
  };
}

function normalizeScheduleData(payload) {
  const games = Array.isArray(payload?.games) ? payload.games : [];
  const playoffGames = games.filter((game) => game.gameType === 3 || game.gameType === 4);
  const usefulGames = playoffGames.length ? playoffGames : games.slice(-7);
  const uniqueGames = dedupeGames(usefulGames.slice(-7));
  const nextGame = uniqueGames.find((game) => !isFinal(game)) || uniqueGames[0];

  return {
    ...fallbackData,
    source: "live",
    lastUpdated: `Mis à jour ${formatTimestamp(new Date())}`,
    headline: nextGame ? statusText(nextGame) : fallbackData.headline,
    gameStatus: nextGame ? gameStatusFromGame(nextGame) : fallbackData.gameStatus,
    mtlLogo: teamLogo(nextGame, "MTL") || fallbackData.mtlLogo,
    opponentLogo: nextGame ? opponentLogoFor(nextGame, "MTL") || fallbackData.opponentLogo : fallbackData.opponentLogo,
    games: uniqueGames.length ? uniqueGames.map(toScheduleRow) : fallbackData.games
  };
}

function dedupeGames(games) {
  return games.filter((game, index, list) => {
    const id = game.id || game.gamePk || `${game.gameDate}-${index}`;
    return list.findIndex((item) => (item.id || item.gamePk || item.gameDate) === id) === index;
  });
}

function toScheduleRow(game, index) {
  const isMTLHome = game.homeTeam?.abbrev === "MTL";
  const live = isLiveState(game);
  const done = isFinal(game);
  let tag;
  let kind;
  if (live) { tag = "En direct"; kind = "live"; }
  else if (done) { tag = "Final"; kind = "final"; }
  else if (isMTLHome) { tag = "Maison"; kind = "home"; }
  else { tag = "Route"; kind = "away"; }

  return {
    date: formatDate(game.gameDate || game.startTimeUTC),
    label: game.seriesGameNumber ? `Match ${game.seriesGameNumber}` : `Match ${index + 1}`,
    detail: gameDetail(game),
    tag,
    kind,
    state: live ? "live" : done ? "final" : "upcoming"
  };
}

function gameDetail(game) {
  const away = game.awayTeam?.abbrev || game.awayTeam?.commonName?.default || "Visiteur";
  const home = game.homeTeam?.abbrev || game.homeTeam?.commonName?.default || "Domicile";
  const venue = game.venue?.default || "Aréna à confirmer";
  const time = game.startTimeUTC && game.gameScheduleState !== "TBD" ? formatTime(game.startTimeUTC) : "";
  const score = Number.isInteger(game.awayTeam?.score) && Number.isInteger(game.homeTeam?.score)
    ? ` · ${game.awayTeam.score}-${game.homeTeam.score}`
    : "";

  return `${away} @ ${home} · ${venue}${time ? ` · ${time}` : ""}${score}`;
}

function gameStatusFromGame(game) {
  const away = game.awayTeam || {};
  const home = game.homeTeam || {};
  const isLive = isLiveState(game);
  const isDone = isFinal(game);
  const clock = game.clock?.timeRemaining || "";
  const period = game.periodDescriptor?.number ? `P${game.periodDescriptor.number}` : "";

  return {
    awayCode: away.abbrev || "VIS",
    homeCode: home.abbrev || "DOM",
    awayScore: Number.isInteger(away.score) ? away.score : 0,
    homeScore: Number.isInteger(home.score) ? home.score : 0,
    state: isLive ? "En direct" : isDone ? "Final" : "Avant-match",
    detail: isLive ? [period, clock].filter(Boolean).join(" · ") : isDone ? "Terminé" : formatTime(game.startTimeUTC),
    isLive,
    startTimeUTC: game.startTimeUTC || null
  };
}

function teamLogo(game, teamCode) {
  if (!game) return "";
  const team = game.awayTeam?.abbrev === teamCode ? game.awayTeam : game.homeTeam;
  return team?.logo || team?.darkLogo || "";
}

function opponentLogoFor(game, teamCode) {
  const opponent = game.awayTeam?.abbrev === teamCode ? game.homeTeam : game.awayTeam;
  return opponent?.logo || opponent?.darkLogo || "";
}

function statusText(game) {
  if (isLiveState(game)) return "Match en direct";
  if (isFinal(game)) return "Dernier match final";
  return game.seriesGameNumber ? `Match ${game.seriesGameNumber} à venir` : "Prochain match";
}

function isLiveState(game) {
  return game.gameState === "LIVE" || game.gameState === "CRIT";
}

function isFinal(game) {
  return game.gameState === "OFF" || game.gameState === "FINAL";
}

// ---------------------- Formatters ----------------------

function formatDate(value) {
  if (!value) return "À confirmer";
  const date = String(value).includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short" }).format(date);
}

function formatTime(value) {
  return new Intl.DateTimeFormat("fr-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
    timeZoneName: "short"
  }).format(new Date(value));
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto"
  }).format(date);
}

function formatNoteTime(date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// ---------------------- Render ----------------------

function renderAppData(data) {
  if (!data) return;

  els.scheduleList.innerHTML = data.games
    .map((game) => {
      const kind = game.kind || (game.state === "live" ? "live" : game.state === "final" ? "final" : "");
      const classes = ["badge"];
      if (kind === "live") classes.push("is-live");
      else if (kind === "final") classes.push("is-final");
      else if (kind === "home") classes.push("is-home");
      else if (kind === "away") classes.push("is-away");
      return `
      <article class="game-row">
        <time>${escapeHtml(game.date)}</time>
        <div>
          <strong>${escapeHtml(game.label)}</strong>
          <small>${escapeHtml(game.detail)}</small>
        </div>
        <span class="${classes.join(" ")}">${escapeHtml(game.tag)}</span>
      </article>
    `;
    })
    .join("");

  els.dataStatus.textContent = data.source === "live" ? "Données NHL en direct" : "Données intégrées";
  els.lastUpdated.textContent = data.lastUpdated;
  els.scoreboardHeadline.textContent = data.headline;
  els.seriesScore.textContent = data.seriesScore;
  els.mtlRecord.textContent = data.mtlRecord;
  els.opponentRecord.textContent = data.opponentRecord;
  els.mtlLogo.src = data.mtlLogo || fallbackData.mtlLogo;
  els.opponentLogo.src = data.opponentLogo || fallbackData.opponentLogo;

  const status = data.gameStatus || fallbackData.gameStatus;
  const previousStatus = lastStatus;
  lastStatus = status;
  renderGameStatus(status, data.recentGoals, previousStatus);
  renderTeamStats(data.teamStats || fallbackData.teamStats);
  renderLeaders(data.leaders || fallbackData.leaders);
  renderLineups(data.lineups || fallbackData.lineups);
  renderLineupUpdated(data.lastUpdated);
  renderPeriodScores(data.periodScores);
  renderStrengthState(data.focusContext?.strengthState);
  renderBracket(data.bracket);
  renderGoalFeed(data.recentGoals, data.focusContext);
  updateCountdown(status);
  els.scoreMeta?.classList.toggle("is-live", Boolean(status.isLive));
}

function renderGameStatus(status, recentGoals, previousStatus) {
  const prevAway = previousStatus?.awayScore;
  const prevHome = previousStatus?.homeScore;

  els.awayCode.textContent = status.awayCode;
  els.homeCode.textContent = status.homeCode;
  els.awayScore.textContent = status.awayScore;
  els.homeScore.textContent = status.homeScore;
  els.gameState.textContent = status.state;
  els.gameClock.textContent = status.detail;
  els.liveScoreCard.classList.toggle("is-live", Boolean(status.isLive));

  const awayScored = Number.isInteger(prevAway) && status.awayScore > prevAway;
  const homeScored = Number.isInteger(prevHome) && status.homeScore > prevHome;
  const mtlIsAway = status.awayCode === "MTL";
  const mtlScored = (mtlIsAway && awayScored) || (!mtlIsAway && homeScored);

  if (awayScored) flashScore(els.awayScore);
  if (homeScored) flashScore(els.homeScore);
  if (mtlScored) celebrateMtlGoal(recentGoals);

  els.miniAwayCode.textContent = status.awayCode;
  els.miniHomeCode.textContent = status.homeCode;
  els.miniAwayScore.textContent = status.awayScore;
  els.miniHomeScore.textContent = status.homeScore;
  els.miniState.textContent = status.isLive ? `${status.state} · ${status.detail}` : status.detail || status.state;
  els.miniScore.classList.toggle("is-live", Boolean(status.isLive));
}

function renderPeriodScores(scores) {
  if (!scores || !Array.isArray(scores.rows) || !scores.rows.length) {
    els.periodTable.hidden = true;
    if (els.periodShotsBody) els.periodShotsBody.hidden = true;
    return;
  }

  const columnCount = scores.rows.length + 2;
  const headerCells = ['<th scope="col">Équipe</th>']
    .concat(scores.rows.map((row) => `<th scope="col">${escapeHtml(row.label)}</th>`))
    .concat('<th scope="col">T</th>')
    .join("");
  els.periodHeader.innerHTML = headerCells;

  const buildRow = (code, rows, key, total) => {
    const cells = rows.map((row) => `<td>${escapeHtml(String(row[key] ?? "—"))}</td>`).join("");
    return `<tr><th scope="row">${escapeHtml(code)}</th>${cells}<td class="is-total">${escapeHtml(String(total))}</td></tr>`;
  };

  els.periodBody.innerHTML = [
    buildRow(scores.awayCode, scores.rows, "away", scores.totalAway),
    buildRow(scores.homeCode, scores.rows, "home", scores.totalHome)
  ].join("");

  if (els.periodShotsBody) {
    if (Array.isArray(scores.shotRows) && scores.shotRows.length) {
      els.periodShotsBody.innerHTML = [
        `<tr><th scope="rowgroup" colspan="${columnCount}">Tirs au but</th></tr>`,
        buildRow(scores.awayCode, scores.shotRows, "away", scores.totalShotsAway ?? 0),
        buildRow(scores.homeCode, scores.shotRows, "home", scores.totalShotsHome ?? 0)
      ].join("");
      els.periodShotsBody.hidden = false;
    } else {
      els.periodShotsBody.innerHTML = "";
      els.periodShotsBody.hidden = true;
    }
  }

  els.periodTable.hidden = false;
}

function renderStrengthState(state) {
  if (!els.strengthBar) return;

  if (!state || !state.isPowerPlay) {
    els.strengthBar.hidden = true;
    els.strengthBar.classList.remove("is-mtl-pp", "is-mtl-pk");
    return;
  }

  const mtlIsAdvantage = state.advantageTeam === "MTL";
  const mtlIsShort = state.shorthandedTeam === "MTL";

  els.strengthBar.classList.toggle("is-mtl-pp", mtlIsAdvantage);
  els.strengthBar.classList.toggle("is-mtl-pk", mtlIsShort);

  const mtlIsAway = state.awayCode === "MTL";
  const skatersFromMtl = mtlIsAway
    ? `${state.awaySkaters}v${state.homeSkaters}`
    : `${state.homeSkaters}v${state.awaySkaters}`;

  els.strengthLabel.textContent = skatersFromMtl;
  els.strengthDetail.textContent = mtlIsAdvantage
    ? `MTL en avantage numérique`
    : mtlIsShort
      ? `MTL en désavantage numérique`
      : `${state.advantageTeam} en avantage`;

  els.strengthBar.hidden = false;
}

function renderBracket(bracket) {
  if (!els.bracketSection || !els.bracketRounds) return;

  if (!bracket || !Array.isArray(bracket.rounds) || !bracket.rounds.length) {
    els.bracketSection.hidden = true;
    return;
  }

  const stateGlyph = (round) => {
    if (round.outcome === "won") return "✓";
    if (round.outcome === "lost") return "✕";
    if (round.state === "in-progress") return "●";
    return "○";
  };

  const stateClass = (round) => {
    if (round.outcome === "won") return "is-won";
    if (round.outcome === "lost") return "is-lost";
    if (round.state === "in-progress") return "is-current";
    return "";
  };

  els.bracketRounds.innerHTML = bracket.rounds.map((round) => {
    const klass = stateClass(round);
    const matchup = round.matchup
      ? `<div class="bracket-matchup-line">
          <span>MTL ${escapeHtml(String(round.matchup.mtlWins))}</span>
          <span>—</span>
          ${round.matchup.opponentLogo ? `<img src="${escapeHtml(round.matchup.opponentLogo)}" alt="" loading="lazy" decoding="async">` : ""}
          <span>${escapeHtml(round.matchup.opponentCode)} ${escapeHtml(String(round.matchup.oppWins))}</span>
        </div>`
      : "";

    return `
      <li class="bracket-round ${klass}">
        <div class="bracket-round-label">
          <small>Ronde ${round.round}</small>
          <strong>${escapeHtml(round.label)}</strong>
        </div>
        <span class="bracket-state" aria-hidden="true">${stateGlyph(round)}</span>
        <div class="bracket-matchup">
          ${matchup}
          <span class="bracket-description">${escapeHtml(round.description || "")}</span>
        </div>
        <span class="bracket-needed">${round.matchup ? "1ère à 4 victoires" : ""}</span>
      </li>
    `;
  }).join("");

  els.bracketSection.hidden = false;
}

function renderGoalFeed(goals, context) {
  if (!Array.isArray(goals) || !goals.length) {
    els.goalFeed.hidden = true;
    return;
  }

  const hasPeriodInfo = goals.some((g) => Number.isInteger(g.periodNumber));
  const goalPeriods = hasPeriodInfo
    ? [...new Set(goals.map((g) => g.periodNumber).filter(Number.isInteger))]
    : [];

  let displayGoals = goals;
  let periodLabelText = "";

  if (hasPeriodInfo && context && goalPeriods.length) {
    const maxGoalPeriod = Math.max(...goalPeriods);
    const live = Boolean(context.isLive);
    const final = Boolean(context.isFinal);

    let target = live && Number.isInteger(context.currentPeriod?.number)
      ? context.currentPeriod.number
      : maxGoalPeriod;

    let filtered = goals.filter((g) => g.periodNumber === target);
    if (!filtered.length && target > 1) {
      target = target - 1;
      filtered = goals.filter((g) => g.periodNumber === target);
    }

    if (!filtered.length) {
      els.goalFeed.hidden = true;
      return;
    }

    displayGoals = filtered;
    periodLabelText = filtered[0]?.period
      || (live && context.currentPeriod?.label)
      || (final && `P${target}`)
      || "";
  } else if (!hasPeriodInfo) {
    // Legacy payload without periodNumber: keep the previous "last 3" behaviour.
    displayGoals = goals.slice(0, 3);
  }

  if (!displayGoals.length) {
    els.goalFeed.hidden = true;
    return;
  }

  const goalsTitle = document.getElementById("goals-title");
  if (periodLabelText && goalsTitle) {
    goalsTitle.textContent = `Buts en ${periodLabelText}`;
  } else if (goalsTitle) {
    goalsTitle.textContent = "3 derniers buts";
  }

  if (context?.isLive) {
    els.goalFeedEyebrow.textContent = "En direct";
    els.goalFeedStatus.textContent = "En direct";
  } else if (context?.isFinal) {
    els.goalFeedEyebrow.textContent = "Match terminé";
    els.goalFeedStatus.textContent = context.label || "Final";
  } else {
    els.goalFeedEyebrow.textContent = "Derniers buts";
    els.goalFeedStatus.textContent = "Récap";
  }

  const mtlIsAway = lastStatus?.awayCode === "MTL";
  const mtlCode = "MTL";
  const oppCode = mtlIsAway ? (lastStatus?.homeCode || "") : (lastStatus?.awayCode || "");

  els.goalList.innerHTML = displayGoals.map((goal) => {
    const strength = (goal.strength || "EV").toUpperCase();
    const tagClass = strength === "PP" ? "is-pp" : strength === "SH" ? "is-sh" : strength === "EN" ? "is-en" : "";
    const isMtl = goal.team === "MTL";
    let score = "";
    if (Number.isInteger(goal.awayScore) && Number.isInteger(goal.homeScore)) {
      const mtlScore = mtlIsAway ? goal.awayScore : goal.homeScore;
      const oppScore = mtlIsAway ? goal.homeScore : goal.awayScore;
      score = oppCode
        ? `${mtlCode} ${mtlScore} — ${oppCode} ${oppScore}`
        : `${goal.awayScore}-${goal.homeScore}`;
    }
    const assists = goal.assists?.length
      ? `Aides: ${goal.assists.join(", ")}`
      : "Sans aide";

    return `
      <li class="goal-row${isMtl ? " is-mtl" : ""}">
        <div class="goal-when">
          <span>${escapeHtml(goal.period || "")}</span>
          <strong>${escapeHtml(goal.time || "")}</strong>
        </div>
        <div class="goal-body">
          <strong>${escapeHtml(goal.team || "")} · ${escapeHtml(goal.scorer || "")}</strong>
          <small>${escapeHtml(assists)}${score ? ` · ${escapeHtml(score)}` : ""}</small>
        </div>
        <span class="goal-tag ${tagClass}">${escapeHtml(strength)}</span>
      </li>
    `;
  }).join("");

  els.goalFeed.hidden = false;
}

function flashScore(el) {
  if (!el) return;
  el.classList.remove("score-flash");
  // Force reflow so the animation can replay.
  void el.offsetWidth;
  el.classList.add("score-flash");
}

// ---------------------- Goal alerts ----------------------

let audioCtx = null;

function alertsEnabled() {
  try { return localStorage.getItem(STORAGE_KEY_ALERTS) === "1"; } catch { return false; }
}

function setAlertsState(enabled, { blocked = false } = {}) {
  try { localStorage.setItem(STORAGE_KEY_ALERTS, enabled ? "1" : "0"); } catch {}
  if (!els.alertsToggle) return;
  els.alertsToggle.setAttribute("aria-pressed", String(enabled));
  els.alertsToggle.classList.toggle("is-blocked", blocked);
  if (blocked) {
    els.alertsToggle.title = "Notifications bloquées dans le navigateur — débloque-les pour activer les alertes.";
  } else {
    els.alertsToggle.title = enabled
      ? "Alertes actives : son, vibration et notif quand le CH marque."
      : "Active les alertes sonores quand le CH marque.";
  }
}

async function toggleAlerts() {
  if (alertsEnabled()) {
    setAlertsState(false);
    return;
  }

  if (!("Notification" in window)) {
    setAlertsState(true);
    return;
  }

  if (Notification.permission === "denied") {
    setAlertsState(false, { blocked: true });
    return;
  }

  if (Notification.permission !== "granted") {
    let result;
    try { result = await Notification.requestPermission(); } catch { result = "default"; }
    if (result !== "granted") {
      setAlertsState(false, { blocked: result === "denied" });
      return;
    }
  }

  setAlertsState(true);
  // Keep updates flowing in background so we catch goals while tab is hidden.
  startPolling();
}

function celebrateMtlGoal(recentGoals) {
  if (!alertsEnabled()) return;

  const latest = Array.isArray(recentGoals) ? recentGoals.find((goal) => goal.team === "MTL") : null;
  const body = latest
    ? `${latest.scorer} · ${latest.period} ${latest.time}`
    : "Les Canadiens viennent de marquer.";

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const note = new Notification("BUT du CH", { body, tag: "ch-goal", renotify: true });
      setTimeout(() => { try { note.close(); } catch {} }, 8000);
    } catch {}
  }

  if ("vibrate" in navigator) {
    try { navigator.vibrate([180, 80, 220, 80, 600]); } catch {}
  }

  playGoalHorn();
}

function playGoalHorn() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const ctx = audioCtx;
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    const playNote = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(1, t0 + 0.06);
      gain.gain.linearRampToValueAtTime(0.85, t0 + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur);
    };

    // Chord that approximates a goal horn: low rumble + harmonic
    playNote(155, 0, 0.55);
    playNote(207, 0, 0.55);
    playNote(155, 0.65, 1.4);
    playNote(207, 0.65, 1.4);
    playNote(311, 0.65, 1.4);
  } catch {}
}

function renderTeamStats(teams) {
  els.teamStatsGrid.innerHTML = teams
    .map((team) => `
      <article class="team-stat-card">
        <div>
          <span>${escapeHtml(team.code)}</span>
          <strong>${escapeHtml(team.name)}</strong>
          <small>${escapeHtml(team.record)}</small>
        </div>
        <div class="metric-grid">
          ${team.metrics.map((metric) => `
            <div>
              <strong>${escapeHtml(metric.value)}</strong>
              <span>${escapeHtml(metric.label)}</span>
            </div>
          `).join("")}
        </div>
      </article>
    `)
    .join("");
}

function renderLeaders(groups) {
  els.leaderGrid.innerHTML = groups
    .map((group) => `
      <article class="leader-team">
        <h3>${escapeHtml(group.team)}</h3>
        <div class="leader-list">
          ${[...group.skaters, ...group.goalies].map(playerCard).join("")}
        </div>
      </article>
    `)
    .join("");
}

function playerCard(player) {
  return `
    <div class="player-card">
      <img src="${escapeHtml(player.headshot || "https://assets.nhle.com/mugs/nhl/latest/default.png")}" alt="" loading="lazy" decoding="async">
      <div>
        <strong>${escapeHtml(player.name)}</strong>
        <small>${escapeHtml(player.meta)}</small>
      </div>
      <span>${escapeHtml(player.stat)}</span>
    </div>
  `;
}

function renderLineups(lineups) {
  const statuses = [...new Set(lineups.map((lineup) => lineup.status))];
  els.lineupStatus.textContent = statuses.length === 1 ? statuses[0] : "Mixte";
  els.lineupGrid.innerHTML = lineups
    .map((lineup) => `
      <article class="lineup-card">
        <div class="lineup-card-header">
          <strong>${escapeHtml(lineup.team)}</strong>
          <span>${escapeHtml(lineup.status)}</span>
        </div>
        <div class="line-block">
          <h3>Attaquants</h3>
          ${lineup.forwards.map(lineRow).join("")}
        </div>
        <div class="line-block">
          <h3>Défenseurs</h3>
          ${lineup.defense.map(lineRow).join("")}
        </div>
        <div class="goalie-row">
          <span>Gardiens</span>
          <strong>${escapeHtml(lineup.goalies.join(" · "))}</strong>
        </div>
      </article>
    `)
    .join("");
}

function lineRow(line) {
  return `
    <div class="line-row">
      ${line.map((slot, index) => index === 0 ? `<span>${escapeHtml(slot)}</span>` : `<strong>${escapeHtml(slot)}</strong>`).join("")}
    </div>
  `;
}

function renderLineupUpdated(lastUpdatedText) {
  if (!els.lineupUpdated) return;
  els.lineupUpdated.textContent = lastUpdatedText || "";
}

// ---------------------- Notes ----------------------

function getNotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES));
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      if (typeof entry === "string") return { text: entry, ts: null };
      if (entry && typeof entry.text === "string") return { text: entry.text, ts: entry.ts || null };
      return null;
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
}

function renderNotes() {
  const notes = getNotes();

  if (!notes.length) {
    els.notesList.innerHTML = `<div class="note-empty">Aucune note pour l’instant.</div>`;
  } else {
    els.notesList.innerHTML = notes
      .map((note, index) => `
        <div class="note-item">
          <div class="note-item-body">
            <span>${escapeHtml(note.text)}</span>
            ${note.ts ? `<time datetime="${escapeHtml(new Date(note.ts).toISOString())}">${escapeHtml(formatNoteTime(new Date(note.ts)))}</time>` : ""}
          </div>
          <button type="button" data-delete="${index}" aria-label="Supprimer cette note">×</button>
        </div>
      `)
      .join("");
  }

  els.notesMeta.textContent = notes.length === 0
    ? "Aucune note"
    : notes.length === 1
      ? "1 note"
      : `${notes.length} notes`;

  for (const button of document.querySelectorAll("[data-disabled-when-empty]")) {
    button.disabled = notes.length === 0;
  }
}

function addNote(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const prefix = noteContextPrefix();
  const final = prefix && !trimmed.startsWith("[") ? `${prefix}${trimmed}` : trimmed;
  const notes = [{ text: final, ts: Date.now() }, ...getNotes()].slice(0, MAX_NOTES);
  saveNotes(notes);
  renderNotes();
}

function noteContextPrefix() {
  if (!lastStatus?.isLive) return "";

  const periodLabel = lastData?.focusContext?.currentPeriod?.label || "";
  const detailParts = (lastStatus.detail || "").split("·").map((s) => s.trim());
  const time = detailParts.find((part) => /^\d{1,2}:\d{2}$/.test(part)) || "";
  const mtlIsAway = lastStatus.awayCode === "MTL";
  const mtlScore = mtlIsAway ? lastStatus.awayScore : lastStatus.homeScore;
  const oppScore = mtlIsAway ? lastStatus.homeScore : lastStatus.awayScore;
  const oppCode = mtlIsAway ? lastStatus.homeCode : lastStatus.awayCode;

  if (!Number.isInteger(mtlScore) || !Number.isInteger(oppScore)) return "";

  const periodAndTime = [periodLabel, time].filter(Boolean).join(" ");
  const score = `MTL ${mtlScore}-${oppScore} ${oppCode}`;
  return periodAndTime ? `[${periodAndTime}, ${score}] ` : `[${score}] `;
}

function deleteNote(index) {
  const notes = getNotes().filter((_, i) => i !== index);
  saveNotes(notes);
  renderNotes();
}

async function copyAllNotes() {
  const notes = getNotes();
  if (!notes.length) return;
  const lines = notes.map((note) => {
    const ts = note.ts ? `[${formatNoteTime(new Date(note.ts))}] ` : "";
    return `${ts}${note.text}`;
  });
  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    flashButton(els.copyNotes, "Copié ✓");
  } catch {
    flashButton(els.copyNotes, "Échec");
  }
}

function flashButton(btn, label) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = original; }, 1400);
}

function clearAllNotes() {
  if (!getNotes().length) return;
  if (!confirm("Effacer toutes les notes ? Cette action est définitive.")) return;
  saveNotes([]);
  renderNotes();
}

// ---------------------- Theme ----------------------

function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("ice-mode", "night-mode");
  if (mode === "light") root.classList.add("ice-mode");
  if (mode === "dark") root.classList.add("night-mode");
  const isLight = mode === "light"
    || (mode === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
  els.themeToggle.setAttribute("aria-pressed", String(isLight));
  if (els.themeLabel) {
    els.themeLabel.textContent = isLight ? "Nuit" : "Glace";
  }
}

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY_THEME) || "auto";
  } catch {
    return "auto";
  }
}

function setTheme(mode) {
  try { localStorage.setItem(STORAGE_KEY_THEME, mode); } catch {}
  applyTheme(mode);
}

// ---------------------- Countdown ----------------------

function updateCountdown(status) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  const target = status?.startTimeUTC ? new Date(status.startTimeUTC) : null;
  if (!target || Number.isNaN(target.getTime()) || status?.isLive || status?.state === "Final") {
    els.countdown.hidden = true;
    return;
  }

  const tick = () => {
    const remaining = target.getTime() - Date.now();
    if (remaining <= 0) {
      els.countdown.hidden = true;
      clearInterval(countdownTimer);
      countdownTimer = null;
      return;
    }
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    els.cdDays.textContent = String(days).padStart(2, "0");
    els.cdHours.textContent = String(hours).padStart(2, "0");
    els.cdMinutes.textContent = String(minutes).padStart(2, "0");
    els.cdSeconds.textContent = String(secs).padStart(2, "0");
    els.countdown.hidden = false;
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}

// ---------------------- Polling lifecycle ----------------------

function pickInterval(data) {
  const status = data?.gameStatus;
  if (status?.isLive) return POLL_LIVE_MS;

  if (status?.startTimeUTC) {
    const msToStart = new Date(status.startTimeUTC).getTime() - Date.now();
    if (msToStart > 0 && msToStart < 60 * 60_000) return POLL_KICKOFF_SOON_MS;
    if (msToStart > 24 * 60 * 60_000) return POLL_IDLE_MS;
  }

  return POLL_DEFAULT_MS;
}

async function runPoll() {
  const result = await fetchLiveData();

  if (result === null) {
    // Aborted — another runPoll has taken over, do not reschedule from here.
    return;
  }

  if (result.__failed) {
    markFreshness(false);
    if (!hasRenderedOnce) {
      renderAppData(fallbackData);
      hasRenderedOnce = true;
    }
    scheduleNextPoll(lastData);
    return;
  }

  if (result.__unchanged) {
    markFreshness(true);
    scheduleNextPoll(lastData);
    return;
  }

  markFreshness(true);
  lastData = result;
  renderAppData(result);
  hasRenderedOnce = true;
  scheduleNextPoll(result);
}

function scheduleNextPoll(data) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(runPoll, pickInterval(data));
}

function startPolling() {
  stopPolling();
  runPoll();
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (inflightController) {
    inflightController.abort();
    inflightController = null;
  }
}

function markFreshness(success) {
  if (success) lastSuccessAt = Date.now();
  updateFreshnessClass();
}

function updateFreshnessClass() {
  if (!els.scoreMeta) return;
  const age = Date.now() - lastSuccessAt;
  els.scoreMeta.classList.remove("is-stale", "is-broken");
  if (age >= BROKEN_AFTER_MS) {
    els.scoreMeta.classList.add("is-broken");
    els.scoreMeta.title = `Données non rafraîchies depuis ${Math.round(age / 60_000)} min`;
  } else if (age >= STALE_AFTER_MS) {
    els.scoreMeta.classList.add("is-stale");
    els.scoreMeta.title = `Dernier rafraîchissement il y a ${Math.max(1, Math.round(age / 60_000))} min`;
  } else {
    els.scoreMeta.title = "Données NHL fraîches";
  }
}

if (!freshnessTimer) {
  freshnessTimer = setInterval(updateFreshnessClass, 20_000);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!alertsEnabled()) stopPolling();
  } else {
    startPolling();
  }
});

// ---------------------- Mobile nav + scrollspy ----------------------

function setupNav() {
  els.navToggle.addEventListener("click", () => {
    const isOpen = els.primaryNav.classList.toggle("is-open");
    els.navToggle.setAttribute("aria-expanded", String(isOpen));
    els.navToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  });

  els.primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      els.primaryNav.classList.remove("is-open");
      els.navToggle.setAttribute("aria-expanded", "false");
    }
  });

  const sections = ["calendrier", "bracket", "stats", "notes"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = new Map(
    Array.from(document.querySelectorAll("[data-spy]"))
      .map((a) => [a.dataset.spy, a])
  );

  if (!("IntersectionObserver" in window) || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        for (const link of links.values()) link.classList.remove("is-active");
        const link = links.get(entry.target.id);
        if (link) link.classList.add("is-active");
      }
    }
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

// ---------------------- Sticky mini-score ----------------------

function setupMiniScore() {
  const target = document.querySelector(".scoreboard");
  if (!target || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      els.miniScore.classList.toggle("is-visible", !entry.isIntersecting);
      els.miniScore.setAttribute("aria-hidden", String(entry.isIntersecting));
    }
  }, { threshold: 0 });
  observer.observe(target);
}

// ---------------------- Boot ----------------------

function setupForms() {
  els.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addNote(els.noteInput.value);
    els.noteInput.value = "";
  });

  els.notesList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-delete]");
    if (!target) return;
    deleteNote(Number(target.dataset.delete));
  });

  els.copyNotes.addEventListener("click", copyAllNotes);
  els.clearNotes.addEventListener("click", clearAllNotes);
}

function setupTheme() {
  applyTheme(getStoredTheme());
  els.themeToggle.addEventListener("click", () => {
    const current = getStoredTheme();
    const isLight = document.documentElement.classList.contains("ice-mode")
      || (current === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
    setTheme(isLight ? "dark" : "light");
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => {
      if (getStoredTheme() === "auto") applyTheme("auto");
    });
  }
}

function setupAlerts() {
  if (!els.alertsToggle) return;
  // Restore previous state silently. We do NOT re-request permission on load
  // (only when the user clicks), and we treat a denied permission as off.
  const saved = alertsEnabled();
  const granted = !("Notification" in window) || Notification.permission === "granted";
  const blocked = "Notification" in window && Notification.permission === "denied";
  setAlertsState(saved && granted, { blocked });
  els.alertsToggle.addEventListener("click", toggleAlerts);
}

function init() {
  setupTheme();
  setupAlerts();
  setupForms();
  setupNav();
  setupMiniScore();
  renderAppData(fallbackData);
  renderNotes();
  startPolling();
}

init();
