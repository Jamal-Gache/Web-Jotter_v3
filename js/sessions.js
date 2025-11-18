// sessions.js
const STORAGE_KEY = "sessions";

export async function saveSession() {
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

export async function renderSessions() {
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

