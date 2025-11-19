// theme.js
import { storageSet } from './storage.js';

const THEME_KEY = "theme";

export function applyTheme(theme) {
  document.documentElement.classList.remove("theme-dark", "theme-light");
  if (theme === "light") {
    document.documentElement.classList.add("theme-light");
  } else {
    document.documentElement.classList.add("theme-dark");
  }
}

export function markActiveThemeCard(theme) {
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.classList.toggle("theme-card--active", card.dataset.theme === theme);
  });
}

export function setupThemeCardClicks() {
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const t = card.dataset.theme || "dark";
      applyTheme(t);
      markActiveThemeCard(t);
      await storageSet({ [THEME_KEY]: t });
    });
  });
}
