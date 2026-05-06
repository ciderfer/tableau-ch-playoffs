const fallbackData = {
  source: "fallback",
  lastUpdated: "Données vérifiées le 6 mai 2026",
  headline: "Match 1 ce soir",
  seriesScore: "0-0",
  nextPuck: "19 h HE · KeyBank Center",
  mtlRecord: "48-24-10",
  opponentRecord: "50-23-9",
  mtlLogo: "https://assets.nhle.com/logos/nhl/svg/MTL_light.svg",
  opponentLogo: "https://assets.nhle.com/logos/nhl/svg/BUF_light.svg",
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
const seriesPill = document.querySelector("#seriesPill");
const nextPuck = document.querySelector("#nextPuck");
const mtlRecord = document.querySelector("#mtlRecord");
const opponentRecord = document.querySelector("#opponentRecord");
const mtlLogo = document.querySelector("#mtlLogo");
const opponentLogo = document.querySelector("#opponentLogo");

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
  nextPuck: nextGame ? gameDetail(nextGame) : fallbackData.nextPuck,
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
  seriesPill.textContent = data.seriesScore;
  nextPuck.textContent = data.nextPuck;
  mtlRecord.textContent = data.mtlRecord;
  opponentRecord.textContent = data.opponentRecord;
  mtlLogo.src = data.mtlLogo || fallbackData.mtlLogo;
  opponentLogo.src = data.opponentLogo || fallbackData.opponentLogo;
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
