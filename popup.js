// popup.js v2.2 — refined UX + themes + stable UI

// Import required functions
import { saveSession, renderSessions } from './sessions.js';
import { saveHighlight, renderHighlights } from './highlights.js';
import { applyTheme } from './theme.js';
import { storageGet, storageSet } from './storage.js';

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
  document.getElementById("saveSessionBtn")?.addEventListener("click", saveSession);
  document.getElementById("saveHighlightBtn")?.addEventListener("click", saveHighlight);

  setupSettingsModal();
  setupThemeCardClicks();
  loadShortcutDisplay();
  setupCopyButtons();
  setupWipeButtons();

  // Restore last active view (sessions or highlights)
  const { [ACTIVE_VIEW_KEY]: lastView = "sessions" } = await storageGet(ACTIVE_VIEW_KEY);
  setView(lastView);
}

// ===== Theme Logic =====
function applyTheme(theme) {
  document.documentElement.classList.remove("theme-dark", "theme-light");
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