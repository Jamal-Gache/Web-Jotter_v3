// highlights.js
const HL_KEY = "highlights";

export async function saveHighlight() {
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

export async function renderHighlights() {
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

