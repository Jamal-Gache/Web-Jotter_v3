// background.js — Web-Jotter v2.0
// Context menu (right-click highlight) + keyboard commands

const STORAGE_KEY = "sessions";
const HL_KEY = "highlights";

// Create the right-click "Add to Web Jotter Highlights" option
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-highlight",
    title: "Add to Web Jotter Highlights",
    contexts: ["selection"]
  });
});

// Handle clicks on the context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "add-highlight") return;
  if (!info.selectionText) return;

  const text = info.selectionText.trim();
  if (!text) return;

  const source = tab && tab.url ? tab.url : null;

  const store = await chrome.storage.local.get(HL_KEY);
  const highlights = Array.isArray(store[HL_KEY]) ? store[HL_KEY] : [];

  const now = Date.now();
  highlights.unshift({
    id: now,
    createdAt: now,
    text,
    source
  });

  await chrome.storage.local.set({ [HL_KEY]: highlights });
});

// Keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open_webjotter") {
    chrome.action.openPopup();
    return;
  }

  if (command === "open_recent_session") {
    const store = await chrome.storage.local.get(STORAGE_KEY);
    const sessions = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];
    if (!sessions.length) return;

    // Sort: pinned first, then newest
    sessions.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const recent = sessions[0];
    if (!recent || !Array.isArray(recent.urls)) return;

    for (const entry of recent.urls) {
      const url = entry && entry.url ? entry.url : null;
      if (url) {
        chrome.tabs.create({ url });
      }
    }
  }
});
