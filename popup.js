// popup.js v2.2 — refined UX + themes + stable UI

// Import required functions
import { saveSession, renderSessions } from './js/sessions.js';
import { saveHighlight, renderHighlights } from './js/highlights.js';
import { applyTheme, markActiveThemeCard, setupThemeCardClicks } from './js/theme.js';
import { storageGet, storageSet, storageClear } from './js/storage.js';
import { STORAGE_KEY } from './js/sessions.js';
import { HL_KEY } from './js/highlights.js';

const ACTIVE_VIEW_KEY = "active_view";
const THEME_KEY = "theme";

// ===== Initialize the App =====
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
  // Initialize theme and tabs
  markActiveThemeCard(initialTheme);
  
  document.querySelectorAll(".feature-tabs .tab").forEach((btn) =>
    btn.addEventListener("click", () => setView(btn.dataset.view))
  );

  // Button Event Listeners for sessions and highlights
  const saveSessionBtn = document.getElementById("saveSessionBtn");
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await saveSession();
      } catch (err) {
        console.error("[Web-Jotter] Error saving session:", err);
        alert("Failed to save session. Please try again.");
      }
    });
  }

  const saveHighlightBtn = document.getElementById("saveHighlightBtn");
  if (saveHighlightBtn) {
    saveHighlightBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await saveHighlight();
      } catch (err) {
        console.error("[Web-Jotter] Error saving highlight:", err);
        alert("Failed to save highlight. Please try again.");
      }
    });
  }

  setupSettingsModal();
  setupThemeCardClicks();
  loadShortcutDisplay();
  setupCopyButtons();
  setupWipeButtons();

  // Restore last active view (sessions or highlights)
  const { [ACTIVE_VIEW_KEY]: lastView = "sessions" } = await storageGet(ACTIVE_VIEW_KEY);
  setView(lastView);
}

// ===== Settings Modal =====
function setupSettingsModal() {
  const openBtn = document.getElementById("openSettingsBtn");
  const closeBtn = document.getElementById("closeSettingsBtn");
  const modal = document.getElementById("settingsModal");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.classList.remove("is-hidden");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("is-hidden");
    });
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("is-hidden");
      }
    });
  }
}

// ===== Shortcut Display =====
async function loadShortcutDisplay() {
  const commands = await chrome.commands.getAll();
  const openCmd = commands.find((c) => c.name === "open_webjotter");
  const recentCmd = commands.find((c) => c.name === "open_recent_session");

  const openEl = document.getElementById("shortcut-open-webjotter");
  const recentEl = document.getElementById("shortcut-open-recent");

  if (openEl && openCmd) {
    openEl.textContent = openCmd.shortcut || "Not set";
  }
  if (recentEl && recentCmd) {
    recentEl.textContent = recentCmd.shortcut || "Not set";
  }
}

// ===== Copy Buttons =====
function setupCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      if (text) {
        await navigator.clipboard.writeText(text);
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1000);
      }
    });
  });
}

// ===== Wipe Buttons =====
function setupWipeButtons() {
  const wipeAllBtn = document.getElementById("wipeDataBtn");
  const wipeSessionsBtn = document.getElementById("wipeSessionsBtn");
  const wipeHighlightsBtn = document.getElementById("wipeHighlightsBtn");
  const confirmInput = document.getElementById("wipeConfirm");

  if (wipeAllBtn && confirmInput) {
    wipeAllBtn.addEventListener("click", async () => {
      if (confirmInput.value.trim() === "DELETE ALL") {
        await storageClear();
        confirmInput.value = "";
        await renderSessions();
        await renderHighlights();
        alert("All data cleared!");
      } else {
        alert('Please type "DELETE ALL" to confirm.');
      }
    });
  }

  if (wipeSessionsBtn) {
    wipeSessionsBtn.addEventListener("click", async () => {
      if (confirm("Clear all sessions? This cannot be undone.")) {
        await storageSet({ [STORAGE_KEY]: [] });
        await renderSessions();
      }
    });
  }

  if (wipeHighlightsBtn) {
    wipeHighlightsBtn.addEventListener("click", async () => {
      if (confirm("Clear all highlights? This cannot be undone.")) {
        await storageSet({ [HL_KEY]: [] });
        await renderHighlights();
      }
    });
  }
}

// ===== View Switching =====
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