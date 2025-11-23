// highlights.js
import { storageGet, storageSet } from './storage.js';

export const HL_KEY = "highlights";

export async function saveHighlight() {
  try {
    const input = document.getElementById("highlightInput");
    if (!input) {
      console.error("[Web-Jotter] highlightInput element not found");
      return;
    }

    const text = (input.value || "").trim();
    if (!text) {
      alert("Please enter some text to save as a highlight.");
      return;
    }

    const store = await storageGet(HL_KEY);
    const highlights = Array.isArray(store[HL_KEY]) ? store[HL_KEY] : [];
    const now = Date.now();

    highlights.unshift({ id: now, text, createdAt: now, source: null });
    await storageSet({ [HL_KEY]: highlights });

    input.value = "";
    await renderHighlights();
  } catch (err) {
    console.error("[Web-Jotter] Error in saveHighlight:", err);
    throw err;
  }
}

export async function renderHighlights() {
  const list = document.getElementById("highlightList");
  if (!list) return;

  const store = await storageGet(HL_KEY);
  const highlights = Array.isArray(store[HL_KEY]) ? store[HL_KEY] : [];
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
    del.onclick = async () => {
      try {
        await deleteHighlight(h.id);
      } catch (err) {
        console.error("[Web-Jotter] Error deleting highlight:", err);
      }
    };
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

// Delete a highlight
async function deleteHighlight(id) {
  const store = await storageGet(HL_KEY);
  const highlights = Array.isArray(store[HL_KEY]) ? store[HL_KEY] : [];
  const filtered = highlights.filter((h) => h.id !== id);
  await storageSet({ [HL_KEY]: filtered });
  await renderHighlights();
}

