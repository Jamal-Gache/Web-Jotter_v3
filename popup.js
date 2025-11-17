// popup.js v2.2 — refined UX + themes + stable UI

const STORAGE_KEY = "sessions";
const HL_KEY = "highlights";
const ACTIVE_VIEW_KEY = "active_view";
const THEME_KEY = "theme";

const openSessions = new Set(); // tracks expanded session IDs

/* ===== Storage / tab helpers ===== */

function storageGet(key) {
  return new Promise((resolve) =>
    chrome.storage.local.get(key, (res) => resolve(res))
  );
}
function storageSet(obj) {
  return new Promise((resolve) =>
    chrome.storage.local.set(obj, () => resolve())
  );
}
function storageClear() {
  return new Promise((resolve) =>
    chrome.storage.local.clear(() => resolve())
  );
}
function tabsQuery(q) {
  return new Promise((resolve) =>
    chrome.tabs.query(q, (tabs) => resolve(tabs))
  );
}
function commandsGetAll() {
  return new Promise((resolve) =>
    chrome.commands.getAll((cmds) => resolve(cmds))
  );
}

/* ===== Bootstrap ===== */

document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    // Ensure we start with a theme
    const { [THEME_KEY]: storedTheme } = await storageGet(THEME_KEY);
    const theme = storedTheme || "dark";
    applyTheme(theme);

    await init(theme);
  })().catch((err) => console.error("[Web-Jotter] init error:", err));
});

async function init(initialTheme) {
  markActiveThemeCard(initialTheme);

  /* Tab switching */
  document
    .querySelectorAll(".feature-tabs .tab")
    .forEach((btn) =>
      btn.addEventListener("click", () => setView(btn.dataset.view))
    );

  const saveSessionBtn = document.getElementById("saveSessionBtn");
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener("click", () => saveCurrentTabs());
  }

  const saveHighlightBtn = document.getElementById("saveHighlightBtn");
  if (saveHighlightBtn) {
    saveHighlightBtn.addEventListener("click", () => saveHighlight());
  }

  setupSettingsModal();
  setupThemeCardClicks();
  loadShortcutDisplay();
  setupCopyButtons();
  setupWipeButtons();

  /* Restore last view */
  const { [ACTIVE_VIEW_KEY]: last = "sessions" } = await storageGet(
    ACTIVE_VIEW_KEY
  );
  await setView(last);
}

/* =======================
   THEME LOGIC
   ======================= */

function applyTheme(theme) {
  document.documentElement.classList.remove("theme-dark", "theme-light");
  // base :root is dark, so only add light class for light mode
  if (theme === "light") {
    document.documentElement.classList.add("theme-light");
  } else {
    document.documentElement.classList.add("theme-dark");
  }
}

function markActiveThemeCard(theme) {
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.classList.toggle("theme-card--active", card.dataset.theme === theme);
  });
}

function setupThemeCardClicks() {
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const t = card.dataset.theme || "dark";
      applyTheme(t);
      markActiveThemeCard(t);
      await storageSet({ [THEME_KEY]: t });
    });
  });
}

/* =======================
   VIEW SWITCHING
   ======================= */

async function setView(view) {
  const vH = document.getElementById("view-highlights");
  const vS = document.getElementById("view-sessions");

  if (!vH || !vS) return;

  vH.classList.add("is-hidden");
  vS.classList.add("is-hidden");

  if (view === "highlights") {
    vH.classList.remove("is-hidden");
    await renderHighlights();
  } else {
    view = "sessions";
    vS.classList.remove("is-hidden");
    await renderSessions();
  }

  document.querySelectorAll(".feature-tabs .tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  await storageSet({ [ACTIVE_VIEW_KEY]: view });
}

/* =======================
   HIGHLIGHTS
   ======================= */

async function saveHighlight() {
  const input = document.getElementById("highlightInput");
  if (!input) return;

  const text = (input.value || "").trim();
  if (!text) return;

  const { highlights = [] } = await storageGet(HL_KEY);
  const now = Date.now();

  highlights.unshift({ id: now, text, createdAt: now, source: null });
  await storageSet({ [HL_KEY]: highlights });

  input.value = "";
  await renderHighlights();
}

async function renderHighlights() {
  const list = document.getElementById("highlightList");
  if (!list) return;

  const { highlights = [] } = await storageGet(HL_KEY);
  list.innerHTML = "";

  if (!highlights.length) {
    list.innerHTML = `<li class="hl-item"><em>No highlights saved yet.</em></li>`;
    return;
  }

  for (const h of highlights) {
    const li = document.createElement("li");
    li.className = "hl-item";

    const row = document.createElement("div");
    row.className = "hl-row";

    const t = document.createElement("div");
    t.className = "hl-text";
    t.textContent = h.text;

    const actions = document.createElement("div");
    actions.className = "hl-actions";

    const copy = document.createElement("button");
    copy.textContent = "Copy";
    copy.classList.add("tilt-btn");
    copy.onclick = async () => {
      await navigator.clipboard.writeText(h.text);
      copy.textContent = "Copied!";
      setTimeout(() => (copy.textContent = "Copy"), 700);
    };

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => deleteHighlight(h.id);
    del.classList.add("tilt-btn");

    actions.append(copy, del);
    row.append(t, actions);
    li.append(row);

    if (h.source) {
      const meta = document.createElement("div");
      meta.className = "hl-meta";
      const a = document.createElement("a");
      a.href = h.source;
      a.target = "_blank";
      try {
        a.textContent = new URL(h.source).hostname.replace(/^www\./, "");
      } catch {
        a.textContent = h.source;
      }
      meta.append("Source: ", a);
      li.append(meta);
    }

    list.append(li);
  }
}

async function deleteHighlight(id) {
  let { highlights = [] } = await storageGet(HL_KEY);
  highlights = highlights.filter((h) => h.id !== id);
  await storageSet({ [HL_KEY]: highlights });
  await renderHighlights();
}

/* =======================
   SESSIONS
   ======================= */

async function saveCurrentTabs() {
  const tabs = await tabsQuery({ currentWindow: true });
  const urls = tabs.map((t) => ({
    url: t.url,
    title: t.title || t.url,
  }));

  const now = Date.now();
  const name = `Session ${new Date(now).toLocaleString()}`;

  let { sessions = [] } = await storageGet(STORAGE_KEY);

  sessions.unshift({ id: now, name, urls, createdAt: now, pinned: false });
  sessions = sortSessions(sessions);

  await storageSet({ [STORAGE_KEY]: sessions });
  await renderSessions();
}

function sortSessions(arr) {
  return [...arr].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return b.createdAt - a.createdAt;
  });
}

async function renderSessions() {
  const list = document.getElementById("sessionList");
  if (!list) return;

  let { sessions = [] } = await storageGet(STORAGE_KEY);
  list.innerHTML = "";

  sessions = sortSessions(sessions);

  if (!sessions.length) {
    list.innerHTML = `<li class="session-item"><em>No sessions saved yet.</em></li>`;
    return;
  }

  for (const s of sessions) {
    const li = document.createElement("li");
    li.className = "session-item";
    if (openSessions.has(s.id)) li.classList.add("expanded");

    /* Header */
    const header = document.createElement("div");
    header.className = "session-header";

    const toggle = document.createElement("button");
    toggle.className = "session-toggle";
    toggle.textContent = openSessions.has(s.id) ? "▾" : "▸";

    const t = document.createElement("div");
    t.className = "session-title";
    t.innerHTML = `${s.name}${s.pinned ? " 📌" : ""}<br><small>${
      s.urls.length
    } tabs • ${new Date(s.createdAt).toLocaleString()}</small>`;

    toggle.onclick = () => {
      if (openSessions.has(s.id)) openSessions.delete(s.id);
      else openSessions.add(s.id);
      renderSessions();
    };

    header.append(toggle, t);
    li.append(header);

    /* Actions */
    const actions = document.createElement("div");
    actions.className = "session-actions";

    const restore = btn("Restore", () => restoreSession(s.id));
    restore.title = "Restore";

    const del = btn("🗑️", () => deleteSession(s.id));
    del.title = "Delete";

    const ren = btn("✒️", () => renameSession(s.id));
    ren.title = "Rename";

    const pin = btn(s.pinned ? "📌" : "📌", () => togglePinSession(s.id));

    actions.append(restore, del, ren, pin);
    li.append(actions);

    /* Tab list */
    const tabList = document.createElement("ul");
    tabList.className = "tab-list";
    if (!openSessions.has(s.id)) tabList.classList.add("is-collapsed");

    s.urls.forEach((entry, i) => {
      const row = document.createElement("li");
      row.className = "tab-row";

      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = entry.title;
      title.title = entry.url;

      const x = document.createElement("button");
      x.className = "tab-delete";
      x.textContent = "×";
      x.onclick = () => removeTabFromSession(s.id, i);
      x.classList.add("tilt-btn");
      row.append(title, x);
      tabList.append(row);
    });

    li.append(tabList);
    list.append(li);
  }
}

/* helper for action buttons */
function btn(label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = fn;
  b.classList.add("tilt-btn");
  return b;
}

async function removeTabFromSession(id, index) {
  let { sessions = [] } = await storageGet(STORAGE_KEY);
  const s = sessions.find((x) => x.id === id);
  if (!s) return;

  s.urls.splice(index, 1);

  if (!s.urls.length) {
    sessions = sessions.filter((x) => x.id !== id);
    openSessions.delete(id);
  }
  await storageSet({ [STORAGE_KEY]: sessions });
  await renderSessions();
}

async function deleteSession(id) {
  let { sessions = [] } = await storageGet(STORAGE_KEY);
  sessions = sessions.filter((s) => s.id !== id);
  openSessions.delete(id);
  await storageSet({ [STORAGE_KEY]: sessions });
  await renderSessions();
}

async function renameSession(id) {
  const n = prompt("New name?");
  if (!n) return;
  let { sessions = [] } = await storageGet(STORAGE_KEY);
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  s.name = n;
  await storageSet({ [STORAGE_KEY]: sessions });
  await renderSessions();
}

async function togglePinSession(id) {
  let { sessions = [] } = await storageGet(STORAGE_KEY);
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  s.pinned = !s.pinned;
  sessions = sortSessions(sessions);
  await storageSet({ [STORAGE_KEY]: sessions });
  await renderSessions();
}

/* =======================
   SESSION RESTORE
   ======================= */

async function restoreSession(id) {
  const { sessions = [] } = await storageGet(STORAGE_KEY);
  const s = sessions.find((x) => x.id === id);
  if (!s || !s.urls.length) return;

  for (const entry of s.urls) {
    if (!entry.url) continue;
    chrome.tabs.create({ url: entry.url });
  }
}

/* =======================
   SHORTCUT DISPLAY
   ======================= */

async function loadShortcutDisplay() {
  const openLab = document.getElementById("shortcut-open-webjotter");
  const recentLab = document.getElementById("shortcut-open-recent");
  if (!openLab || !recentLab) return;

  let cmds = [];
  try {
    cmds = await commandsGetAll();
  } catch {
    openLab.textContent = "Unavailable";
    recentLab.textContent = "Unavailable";
    return;
  }

  const c1 = cmds.find((x) => x.name === "open_webjotter");
  const c2 = cmds.find((x) => x.name === "open_recent_session");

  openLab.textContent = c1?.shortcut || "Not set";
  recentLab.textContent = c2?.shortcut || "Not set";
}

/* =======================
   SETTINGS MODAL
   ======================= */

function setupSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const open = document.getElementById("openSettingsBtn");
  const close = document.getElementById("closeSettingsBtn");

  if (!modal || !open || !close) return;

  open.onclick = () => modal.classList.remove("is-hidden");
  close.onclick = () => modal.classList.add("is-hidden");
}

/* =======================
   SHORTCUT COPY BUTTONS
   ======================= */

function setupCopyButtons() {
  document.querySelectorAll(".shortcut-copy-btn").forEach((btn) => {
    btn.onclick = async () => {
      const txt = btn.dataset.copy;
      if (!txt) return;
      await navigator.clipboard.writeText(txt);
      btn.textContent = "✓";
      setTimeout(() => (btn.textContent = "📋"), 600);
    };
  });
}

/* =======================
   CLEAR / WIPE LOGIC
   ======================= */

function setupWipeButtons() {
  const wipeAll = document.getElementById("wipeDataBtn");
  const wipeConfirm = document.getElementById("wipeConfirm");
  const wipeSess = document.getElementById("wipeSessionsBtn");
  const wipeHL = document.getElementById("wipeHighlightsBtn");

  if (wipeAll) {
    wipeAll.onclick = async () => {
      if ((wipeConfirm.value || "").toUpperCase() !== "DELETE ALL") {
        alert('Type "DELETE ALL" first');
        return;
      }
      await storageClear();
      await storageSet({ [THEME_KEY]: "dark" });
      location.reload();
    };
  }

  if (wipeSess) {
    wipeSess.onclick = async () => {
      await storageSet({ [STORAGE_KEY]: [] });
      await renderSessions();
      alert("All sessions cleared.");
    };
  }

  if (wipeHL) {
    wipeHL.onclick = async () => {
      await storageSet({ [HL_KEY]: [] });
      await renderHighlights();
      alert("All highlights cleared.");
    };
  }
}
