// sessions.js
import { storageGet, storageSet } from './storage.js';

export const STORAGE_KEY = "sessions";

// Helper function to query tabs
function tabsQuery(query) {
  return new Promise((resolve) => {
    chrome.tabs.query(query, resolve);
  });
}

// Track expanded sessions
const openSessions = new Set();

// Helper function to create buttons
function btn(text, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.onclick = onClick;
  button.classList.add("tilt-btn");
  return button;
}

export async function saveSession() {
  try {
    const tabs = await tabsQuery({ currentWindow: true });
    if (!tabs || tabs.length === 0) {
      alert("No tabs to save!");
      return;
    }

    const urls = tabs.map((t) => ({
      url: t.url,
      title: t.title || t.url,
    }));

    const now = Date.now();
    const name = `Session ${new Date(now).toLocaleString()}`;

    const store = await storageGet(STORAGE_KEY);
    const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];

    sessions.unshift({ id: now, name, urls, createdAt: now, pinned: false });
    const sorted = sortSessions(sessions);

    await storageSet({ [STORAGE_KEY]: sorted });
    await renderSessions();
  } catch (err) {
    console.error("[Web-Jotter] Error in saveSession:", err);
    throw err;
  }
}

function sortSessions(arr) {
  return [...arr].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return b.createdAt - a.createdAt;
  });
}

export async function renderSessions() {
  const list = document.getElementById("sessionList");
  if (!list) return;

  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  list.innerHTML = "";

  const sorted = sortSessions(sessions);

  if (!sorted.length) {
    list.innerHTML = `<li class="session-item"><em>No sessions saved yet.</em></li>`;
    return;
  }

  for (const s of sorted) {
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

    toggle.onclick = async () => {
      if (openSessions.has(s.id)) openSessions.delete(s.id);
      else openSessions.add(s.id);
      await renderSessions();
    };

    header.append(toggle, t);
    li.append(header);

    /* Actions */
    const actions = document.createElement("div");
    actions.className = "session-actions";

    const restore = btn("Restore", async () => {
      try {
        await restoreSession(s.id);
      } catch (err) {
        console.error("[Web-Jotter] Error restoring session:", err);
      }
    });
    restore.title = "Restore";

    const del = btn("🗑️", async () => {
      try {
        await deleteSession(s.id);
      } catch (err) {
        console.error("[Web-Jotter] Error deleting session:", err);
      }
    });
    del.title = "Delete";

    const ren = btn("✒️", async () => {
      try {
        await renameSession(s.id);
      } catch (err) {
        console.error("[Web-Jotter] Error renaming session:", err);
      }
    });
    ren.title = "Rename";

    const pin = btn(s.pinned ? "📌" : "📍", async () => {
      try {
        await togglePinSession(s.id);
      } catch (err) {
        console.error("[Web-Jotter] Error toggling pin:", err);
      }
    });
    pin.title = s.pinned ? "Unpin" : "Pin";

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
      x.onclick = async () => {
        try {
          await removeTabFromSession(s.id, i);
        } catch (err) {
          console.error("[Web-Jotter] Error removing tab:", err);
        }
      };
      x.classList.add("tilt-btn");
      row.append(title, x);
      tabList.append(row);
    });

    li.append(tabList);
    list.append(li);
  }
}

// Restore a session by opening all its tabs
async function restoreSession(id) {
  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  const session = sessions.find((s) => s.id === id);
  if (!session || !Array.isArray(session.urls)) return;

  for (const entry of session.urls) {
    const url = entry && entry.url ? entry.url : null;
    if (url) {
      chrome.tabs.create({ url });
    }
  }
}

// Delete a session
async function deleteSession(id) {
  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  const filtered = sessions.filter((s) => s.id !== id);
  await storageSet({ [STORAGE_KEY]: filtered });
  await renderSessions();
}

// Rename a session
async function renameSession(id) {
  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  const session = sessions.find((s) => s.id === id);
  if (!session) return;

  const newName = prompt("Enter new session name:", session.name);
  if (!newName || newName.trim() === "") return;

  const updated = sessions.map((s) =>
    s.id === id ? { ...s, name: newName.trim() } : s
  );
  await storageSet({ [STORAGE_KEY]: updated });
  await renderSessions();
}

// Toggle pin status of a session
async function togglePinSession(id) {
  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  const updated = sessions.map((s) =>
    s.id === id ? { ...s, pinned: !s.pinned } : s
  );
  await storageSet({ [STORAGE_KEY]: updated });
  await renderSessions();
}

// Remove a tab from a session
async function removeTabFromSession(sessionId, tabIndex) {
  const store = await storageGet(STORAGE_KEY);
  const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
  const session = sessions.find((s) => s.id === sessionId);
  if (!session || !Array.isArray(session.urls)) return;

  const updatedUrls = session.urls.filter((_, i) => i !== tabIndex);
  const updated = sessions.map((s) =>
    s.id === sessionId ? { ...s, urls: updatedUrls } : s
  );
  await storageSet({ [STORAGE_KEY]: updated });
  await renderSessions();
}

