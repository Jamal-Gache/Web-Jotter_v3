# 🕷️ WEB JOTTER  
### _Your Browser’s Friendly Neighborhood Tab-Slinger_

<p align="center">
  <img src="spider_mascot.png" width="110" alt="Web Jotter Spider Mascot">
</p>

<p align="center">
  <strong>Save browser sessions. Capture highlights. Switch themes. Tame the chaos.</strong><br>
  Built with ❤️ in pure JavaScript, Chrome Manifest V3, and a dash of comic magic.
</p>

---

## 📖 Table of Contents
- [✨ Why Web Jotter Exists](#-why-web-jotter-exists)
- [🕸️ Features](#️-features)
- [🎨 Theme & Design Philosophy](#-theme--design-philosophy)
- [🚀 Usage Guide](#-usage-guide)
  - [Saving Highlights](#saving-highlights)
  - [Saving Sessions](#saving-sessions)
  - [Settings Modal](#settings-modal)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [🛠️ Tech Stack](#️-tech-stack)
- [📸 Screenshots](#-screenshots)
- [⛩️ Project Structure](#️-project-structure)
- [🧭 Roadmap](#-roadmap)
- [🤝 Contributors](#-contributors)
- [📜 License](#-license)

---

# ✨ Why Web Jotter Exists

Web Jotter was born from a simple frustration:

> _“Why does my browser look like a crime scene every night?”_

Tabs everywhere.  
Quotes you meant to save.  
Sessions you meant to revisit.  
And zero motivation to clean any of it.

**Web Jotter exists to bring calm to the chaos**, blending:
- Fun comic-book aesthetics  
- Intuitive UI  
- Practical tools for everyday browsing  

It’s the browser companion we wished existed — one that doesn’t just save your tabs, but gives them style.

---

# 🕸️ Features

### 📝 Highlights
- Save text highlights manually or via right-click context menu  
- Automatic timestamping  
- Optional source URLs  
- Copy or delete with one click  
- Neatly styled highlight cards  

### 🔖 Tab Sessions
- Save all open tabs instantly  
- Restore entire sessions at once  
- Rename, delete, expand, or pin sessions  
- Delete individual tabs inside saved sessions  
- Persist expanded states even after edits  

### 🎨 Light & Dark Themes
Switch between:
- **Dark Mode** — neon, comic-book nighttime vibes  
- **Light Mode** — soft pastels for daytime sleuthing  

Theme affects:
- Panels  
- Accent colors  
- Mascot ring glow  
- Shadows & borders  

### ⚡ Tilt Animations
Every interactive element features:
- Micro-tilt hover effect  
- Comic-style click animation  
- Smooth transitions  

### 🔧 Settings Modal
- Theme selection  
- View shortcuts  
- Quick-copy shortcut URLs  
- Danger Zone (clear sessions/highlights/all data with confirmation)  

### ⌨️ Keyboard Shortcuts
- **Open Web Jotter**  
- **Restore Most Recent Session**  
(Shown in Settings)

---

# 🎨 Theme & Design Philosophy

Web Jotter follows a simple creative rule:

> _“If a comic hero would use it, it belongs in the UI.”_

That means:
- **Bangers** for headings  
- **Mulish** for smooth body text  
- Neon accents  
- Soft shadows  
- Vibrant bubbles and mascot rings  
- Playful motion  

Yet everything is still:
- Accessible  
- Clean  
- Legible  
- Professional  

This balance is what makes the extension feel **alive but usable**.

---

# 🚀 Usage Guide

# Saving Highlights
- Open popup → type/paste → Save Highlight
  OR
- right-click selected text → Add to Web Jotter Highlights

# Saving Sessions
Click Save Tabs as Session

# Captures:
- URLs
- Page titles
- Timestamp

Manage with:
- Restore
- Rename
- Pin
- Delete
- Remove individual tabs

# Settings Modal
Switch themes, view shortcuts, copy shortcut links, clear data.

# Keyboard Shortcuts
- Check in Settings → “Shortcuts”
- Configure via:
```bash
chrome://extensions/shortcuts
```

# 🛠️ Tech Stack

- JavaScript (ES6)
- HTML5 + CSS3
- Chrome Manifest V3
- chrome.storage.local
- chrome.tabs
- chrome.commands
- chrome.contextMenus
- Google Fonts (Bangers + Mulish)


# 📸 Screenshots

None ready yet, but check back soon!

---

# ⛩️ Project Structure

Web-Jotter/
>├── background.js
>├── manifest.json
>├── popup.html
>├── popup.js
>├── style.css
>├── spider_mascot.png
>└── README.md

(Will migrate to modular `/src` architecture in future versions.)

---
# 🧭 Roadmap

### Near-Term Improvements
- Favicon rendering in session lists  
- In-extension search (sessions + highlights)  
- Convert action buttons → three-dot menus  
- “Open Web Jotter in New Tab” full-page mode  
- Improved spacing + layout hierarchy  

### Mid-Term Goals
- Full ES-module refactor  
- Virtualized lists for large datasets  
- Highlight grouping by date/domain  
- JSON + Markdown export/import  

### Long-Term Vision
- Chrome Web Store launch  
- OperaGX Store listing  
- Optional cloud sync  

---
# 🤝 Contributors
" **Work of Jamal Gache** "  
---

# 📜 License

**MIT License** — free to use, remix, and expand.  
Just don’t remove the spider. 🕷️
