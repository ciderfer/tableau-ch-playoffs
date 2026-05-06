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

const $ = (selector) => document.querySelector(selector);

const els = {
  scheduleList: $("#scheduleList"),
  factorGrid: $("#factorGrid"),
  noteForm: $("#noteForm"),
  noteInput: $("#noteInput"),
  notesList: $("#notesList"),
  notesMeta: $("#notesMeta"),
  copyNotes: $("#copyNotes"),
  clearNotes: $("#clearNotes"),
  themeToggle: $("#themeToggle"),
  themeLabel: document.querySelector("#themeToggle .theme-label"),
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
  cdSeconds: $("#cdSeconds")
};

const STORAGE_KEY_NOTES = "tableau-ch-notes";
const STORAGE_KEY_THEME = "tableau-ch-theme";
const POLL_INTERVAL_MS = 60_000;
const MAX_NOTES = 50;

let pollTimer = null;
let inflightController = null;
let countdownTimer = null;
let lastStatus = null;

// ---------------------- Data fetching ----------------------

async function fetchLiveData() {
  if (inflightController) {
    inflightController.abort();
  }

  inflightController = new AbortController();
  const { signal } = inflightController;

  const endpoints = [
    { url: "/.netlify/functions/nhl", normalize: normalizeFunctionData },
    { url: "https://api-web.nhle.com/v1/club-schedule-season/MTL/now", normalize: normalizeScheduleData }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { cache: "no-store", signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
  lastStatus = status;
  renderGameStatus(status);
  renderTeamStats(data.teamStats || fallbackData.teamStats);
  renderLeaders(data.leaders || fallbackData.leaders);
  renderLineups(data.lineups || fallbackData.lineups);
  updateCountdown(status);
  els.scoreMeta?.classList.toggle("is-live", Boolean(status.isLive));
}

function renderGameStatus(status) {
  const prevAway = lastStatus?.awayScore;
  const prevHome = lastStatus?.homeScore;

  els.awayCode.textContent = status.awayCode;
  els.homeCode.textContent = status.homeCode;
  els.awayScore.textContent = status.awayScore;
  els.homeScore.textContent = status.homeScore;
  els.gameState.textContent = status.state;
  els.gameClock.textContent = status.detail;
  els.liveScoreCard.classList.toggle("is-live", Boolean(status.isLive));

  if (Number.isInteger(prevAway) && status.awayScore > prevAway) {
    flashScore(els.awayScore);
  }
  if (Number.isInteger(prevHome) && status.homeScore > prevHome) {
    flashScore(els.homeScore);
  }

  els.miniAwayCode.textContent = status.awayCode;
  els.miniHomeCode.textContent = status.homeCode;
  els.miniAwayScore.textContent = status.awayScore;
  els.miniHomeScore.textContent = status.homeScore;
  els.miniState.textContent = status.isLive ? `${status.state} · ${status.detail}` : status.detail || status.state;
  els.miniScore.classList.toggle("is-live", Boolean(status.isLive));
}

function flashScore(el) {
  if (!el) return;
  el.classList.remove("score-flash");
  // Force reflow so the animation can replay.
  void el.offsetWidth;
  el.classList.add("score-flash");
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

function renderFactors() {
  els.factorGrid.innerHTML = factors
    .map((factor) => `
      <article class="factor">
        <span aria-hidden="true">${escapeHtml(factor.icon)}</span>
        <h3>${escapeHtml(factor.title)}</h3>
        <p>${escapeHtml(factor.text)}</p>
      </article>
    `)
    .join("");
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
  const notes = [{ text: trimmed, ts: Date.now() }, ...getNotes()].slice(0, MAX_NOTES);
  saveNotes(notes);
  renderNotes();
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

function startPolling() {
  stopPolling();
  fetchLiveData().then((data) => { if (data) renderAppData(data); });
  pollTimer = setInterval(() => {
    fetchLiveData().then((data) => { if (data) renderAppData(data); });
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPolling();
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

  const sections = ["calendrier", "series", "stats", "notes"]
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

function init() {
  setupTheme();
  setupForms();
  setupNav();
  setupMiniScore();
  renderAppData(fallbackData);
  renderFactors();
  renderNotes();
  startPolling();
}

init();
