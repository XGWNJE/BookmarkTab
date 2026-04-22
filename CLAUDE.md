# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookmarkTab is a Chrome Extension (Manifest V3) that replaces the new tab page with an elegant bookmark manager featuring glassmorphism design and automatic dark/light mode support. It reads and writes directly to Chrome's native bookmark data.

## Architecture

```
BookmarkTab/
├── components/     # UI components (BookmarkCard, BookmarkGrid, Breadcrumb, Dialogs, etc.)
├── core/           # Data layer and system infrastructure
├── css/            # Styles organized by feature module
├── icons/          # Extension icons
└── main.js         # Application entry point
```

### Core Layer (./core/)

- **BookmarkStore.js** — Data layer wrapping `chrome.bookmarks` API. Handles CRUD operations, favicon caching (memory + localStorage dual-layer), and custom icon storage. All bookmark operations go through this singleton.
- **Router.js** — Navigation layer managing folder hierarchy with browser history integration. Maintains a stack of folder paths and emits `navigate` events via EventBus.
- **EventBus.js** — Publish/subscribe event system decoupling all components. Used extensively for cross-component communication (e.g., `navigate`, `card:dragstart`, `toolbar:newBookmark`).

### Component Layer (./components/)

Components are loosely coupled and communicate via EventBus events. Each component typically:
- Subscribes to relevant events in its constructor
- Renders UI and attaches DOM event listeners
- Emits events for state changes

Key components:
- **BookmarkGrid.js** — Grid container rendering bookmark cards for current folder
- **BookmarkCard.js** — Individual bookmark/folder card with drag-drop, right-click menu, custom icon support
- **Breadcrumb.js** — Folder path navigation bar
- **EditDialog.js** — Create/edit bookmark or folder dialog
- **MoveDialog.js** — Target folder selection for move operations
- **QuickFind.js** — Global fuzzy search overlay (`/` or `Ctrl+F`)
- **Toolbar.js** — Top toolbar with actions

### CSS (./css/)

Modular CSS architecture using CSS custom properties. Key modules:
- `variables.css` — Design tokens (colors, spacing, border-radius, transitions)
- `card.css` — Bookmark card styles and context menu
- `drag-zones.css` — Edge drag zones (left: move panel, right: delete zone)
- `animations.css` — Card entrance/hover animations

## Key Patterns

**Event-driven communication**: Components never call each other directly. `BookmarkGrid` listens for `navigate` from Router, `Toolbar` emits `toolbar:newBookmark` caught by `EditDialog`, etc.

**Favicon caching**: `BookmarkStore` uses domain-extracted favicon caching with `chrome-extension://.../_favicon/` API primary and Google Favicon API fallback. Failed lookups are marked to prevent retry storms.

**Drag-drop zones**: Main content area has invisible edge triggers (12% viewport width each side). Left edge shows folder tree panel for move target, right edge shows delete confirmation.

**SVG sanitization**: Custom icons (SVG) have `<script>`, `on*` attributes, and `javascript:` links stripped before storage.

## Development

**Loading the extension:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" → select project root
4. Open a new tab to see changes

**After code changes:** Click the refresh button on the extension card in `chrome://extensions/`

**No build step** — pure ES Modules, loads directly from source.

**No third-party dependencies** — vanilla JavaScript (ES2020+), CSS3, Chrome Extensions Manifest V3 only.
