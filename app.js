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
    isLive: false
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
    { date: "6 mai", label: "Match 1", detail: "MTL @ BUF · KeyBank Center · 19 h HE", tag: "Ce soir" },
    { date: "8 mai", label: "Match 2", detail: "MTL @ BUF · KeyBank Center", tag: "Route" },
    { date: "10 mai", label: "Match 3", detail: "BUF @ MTL · Centre Bell", tag: "Maison" },
    { date: "12 mai", label: "Match 4", detail: "BUF @ MTL · Centre Bell", tag: "Maison" },
    { date: "14 mai", label: "Match 5", detail: "MTL @ BUF · si nécessaire", tag: "Au besoin" },
    { date: "16 mai", label: "Match 6", detail: "BUF @ MTL · si nécessaire", tag: "Au besoin" },
    { date: "18 mai", label: "Match 7", detail: "MTL @ BUF · si nécessaire", tag: "Décisif" }
  ]
};

const factors = [
  {
    icon: "PP",
    title: "Avantage numérique",
    text: "Montréal arrive avec une occasion claire: rallumer le jeu de puissance après une fin de ronde plus froide."
  },
  {
    icon: "G",
    title: "Duel Dobes-Lyon",
    text: "Jakub Dobes et Alex Lyon sont deux points d’ancrage de cette série. Le premier but pourrait peser lourd."
  },
  {
    icon: "R",
    title: "Départ sur la route",
    text: "Le CH a déjà gagné trois fois à Tampa Bay. Le bruit adverse n’est pas forcément une mauvaise nouvelle."
  },
  {
    icon: "13",
    title: "Équilibre parfait",
    text: "En saison régulière, chaque club a gagné deux matchs et marqué 13 buts. Le détail va décider."
  }
];

const scheduleList = document.querySelector("#scheduleList");
const factorGrid = document.querySelector("#factorGrid");
const noteForm = document.querySelector("#noteForm");
const noteInput = document.querySelector("#noteInput");
const notesList = document.querySelector("#notesList");
const themeToggle = document.querySelector("#themeToggle");
const dataStatus = document.querySelector("#dataStatus");
const lastUpdated = document.querySelector("#lastUpdated");
const scoreboardHeadline = document.querySelector("#scoreboardHeadline");
const seriesScore = document.querySelector("#seriesScore");
const mtlRecord = document.querySelector("#mtlRecord");
const opponentRecord = document.querySelector("#opponentRecord");
const mtlLogo = document.querySelector("#mtlLogo");
const opponentLogo = document.querySelector("#opponentLogo");
const awayCode = document.querySelector("#awayCode");
const homeCode = document.querySelector("#homeCode");
const awayScore = document.querySelector("#awayScore");
const homeScore = document.querySelector("#homeScore");
const gameState = document.querySelector("#gameState");
const gameClock = document.querySelector("#gameClock");
const liveScoreCard = document.querySelector("#liveScoreCard");
const teamStatsGrid = document.querySelector("#teamStatsGrid");
const leaderGrid = document.querySelector("#leaderGrid");
const lineupGrid = document.querySelector("#lineupGrid");
const lineupStatus = document.querySelector("#lineupStatus");

const storageKey = "tableau-ch-notes";

async function fetchLiveData() {
  const endpoints = [
    "/.netlify/functions/nhl",
    "https://api-web.nhle.com/v1/club-schedule-season/MTL/now"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      return endpoint.includes("netlify") ? normalizeFunctionData(payload) : normalizeScheduleData(payload);
    } catch {
      continue;
    }
  }

  return fallbackData;
}

function normalizeFunctionData(payload) {
  if (!payload || !Array.isArray(payload.games)) {
    return fallbackData;
  }

  return {
    ...fallbackData,
    ...payload,
    source: "live",
    lastUpdated: payload.lastUpdated?.includes("T")
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
    gameStatus: nextGame ? gameStatus(nextGame) : fallbackData.gameStatus,
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
  return {
    date: formatDate(game.gameDate || game.startTimeUTC),
    label: game.seriesGameNumber ? `Match ${game.seriesGameNumber}` : `Match ${index + 1}`,
    detail: gameDetail(game),
    tag: isFinal(game) ? "Final" : index === 0 ? "À venir" : "Calendrier"
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
    detail: isLive ? [period, clock].filter(Boolean).join(" · ") : isDone ? "Terminé" : formatTime(game.startTimeUTC),
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

function formatDate(value) {
  if (!value) {
    return "À confirmer";
  }

  const date = String(value).includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function isFinal(game) {
  return game.gameState === "OFF" || game.gameState === "FINAL";
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

function renderAppData(data) {
  scheduleList.innerHTML = data.games
    .map((game) => `
      <article class="game-row">
        <time>${escapeHtml(game.date)}</time>
        <div>
          <strong>${escapeHtml(game.label)}</strong>
          <small>${escapeHtml(game.detail)}</small>
        </div>
        <span class="badge">${escapeHtml(game.tag)}</span>
      </article>
    `)
    .join("");

  dataStatus.textContent = data.source === "live" ? "Données NHL en direct" : "Données intégrées";
  lastUpdated.textContent = data.lastUpdated;
  scoreboardHeadline.textContent = data.headline;
  seriesScore.textContent = data.seriesScore;
  mtlRecord.textContent = data.mtlRecord;
  opponentRecord.textContent = data.opponentRecord;
  mtlLogo.src = data.mtlLogo || fallbackData.mtlLogo;
  opponentLogo.src = data.opponentLogo || fallbackData.opponentLogo;
  renderGameStatus(data.gameStatus || fallbackData.gameStatus);
  renderTeamStats(data.teamStats || fallbackData.teamStats);
  renderLeaders(data.leaders || fallbackData.leaders);
  renderLineups(data.lineups || fallbackData.lineups);
}

function renderGameStatus(status) {
  awayCode.textContent = status.awayCode;
  homeCode.textContent = status.homeCode;
  awayScore.textContent = status.awayScore;
  homeScore.textContent = status.homeScore;
  gameState.textContent = status.state;
  gameClock.textContent = status.detail;
  liveScoreCard.classList.toggle("is-live", Boolean(status.isLive));
}

function renderTeamStats(teams) {
  teamStatsGrid.innerHTML = teams
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
  leaderGrid.innerHTML = groups
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
      <img src="${escapeHtml(player.headshot || "https://assets.nhle.com/mugs/nhl/latest/default.png")}" alt="">
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
  lineupStatus.textContent = statuses.length === 1 ? statuses[0] : "Mixte";
  lineupGrid.innerHTML = lineups
    .map((lineup) => `
      <article class="lineup-card">
        <div class="lineup-card-header">
          <strong>${escapeHtml(lineup.team)}</strong>
          <span>${escapeHtml(lineup.status)}</span>
        </div>
        <div class="line-block">
          <h3>Attaquants</h3>
          ${lineup.forwards.map((line) => lineRow(line)).join("")}
        </div>
        <div class="line-block">
          <h3>Défenseurs</h3>
          ${lineup.defense.map((line) => lineRow(line)).join("")}
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

function renderFactors() {
  factorGrid.innerHTML = factors
    .map((factor) => `
      <article class="factor">
        <span>${factor.icon}</span>
        <h3>${factor.title}</h3>
        <p>${factor.text}</p>
      </article>
    `)
    .join("");
}

function getNotes() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(storageKey, JSON.stringify(notes));
}

function renderNotes() {
  const notes = getNotes();
  notesList.innerHTML = notes.length
    ? notes
        .map((note, index) => `
          <div class="note-item">
            <span>${escapeHtml(note)}</span>
            <button type="button" data-delete="${index}" aria-label="Supprimer cette note">×</button>
          </div>
        `)
        .join("")
    : `<div class="note-item"><span>Aucune note pour l’instant.</span></div>`;
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

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = noteInput.value.trim();

  if (!value) {
    return;
  }

  const notes = [value, ...getNotes()].slice(0, 8);
  saveNotes(notes);
  noteInput.value = "";
  renderNotes();
});

notesList.addEventListener("click", (event) => {
  const deleteIndex = event.target.dataset.delete;

  if (deleteIndex === undefined) {
    return;
  }

  const notes = getNotes().filter((_, index) => index !== Number(deleteIndex));
  saveNotes(notes);
  renderNotes();
});

themeToggle.addEventListener("click", () => {
  const enabled = document.documentElement.classList.toggle("ice-mode");
  themeToggle.setAttribute("aria-pressed", String(enabled));
  themeToggle.lastChild.textContent = enabled ? " Mode nuit" : " Mode glace";
});

renderAppData(fallbackData);
renderFactors();
renderNotes();
fetchLiveData().then(renderAppData);
setInterval(() => {
  fetchLiveData().then(renderAppData);
}, 60000);
