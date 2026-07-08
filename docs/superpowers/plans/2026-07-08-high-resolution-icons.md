# High-Resolution Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace favicon-first card rendering with a maintainable icon-library-first system, first-letter fallback, and explicit user custom SVG/bitmap overrides.

**Architecture:** Add focused `core/icons/` modules for sanitizing, storage, local library matching, and final icon resolution. Keep default icon resolution local and deterministic; keep remote/Iconify/iconfont behavior inside the manual SVG search flow.

**Tech Stack:** Chrome MV3, browser ES Modules, Node `node:test`, generated Simple Icons data, no runtime build step.

## Global Constraints

- Default card icons come from a local icon library.
- If no library match exists, render a deterministic first-letter fallback.
- User custom icons always win over default icons.
- Bitmap uploads must decode to at least 256x256 before storage.
- SVGs must pass one shared sanitizer.
- Default card rendering must not fetch favicons.
- Do not commit unless the user explicitly asks.
- Preserve existing uncommitted user changes.

---

### Task 1: Core Icon Tests And Sanitizer

**Files:**
- Create: `tests/icon-sanitizer.test.mjs`
- Create: `core/icons/IconSanitizer.js`

**Interfaces:**
- Produces: `sanitizeSvg(raw: string): string | null`
- Produces: `isSvgRaw(value: unknown): boolean`

- [ ] **Step 1: Write failing sanitizer tests**

Create `tests/icon-sanitizer.test.mjs` with tests for valid SVG, invalid SVG, script removal, event-handler removal, unsafe URL removal, external href removal, and unsafe style removal.

- [ ] **Step 2: Run sanitizer test and verify RED**

Run: `node --test tests\icon-sanitizer.test.mjs`

Expected: FAIL because `core/icons/IconSanitizer.js` does not exist.

- [ ] **Step 3: Implement shared sanitizer**

Create `core/icons/IconSanitizer.js` with `sanitizeSvg` and `isSvgRaw`.

- [ ] **Step 4: Run sanitizer test and verify GREEN**

Run: `node --test tests\icon-sanitizer.test.mjs`

Expected: PASS.

### Task 2: Icon Storage Boundary

**Files:**
- Create: `tests/icon-storage.test.mjs`
- Create: `core/icons/IconStorage.js`

**Interfaces:**
- Produces: `createIconStorage(options): IconStorage`
- Produces methods: `getCustomIcon`, `setCustomIcon`, `removeCustomIcon`, `getResolvedIcon`, `setResolvedIcon`, `clearResolvedIcon`

- [ ] **Step 1: Write failing storage tests**

Cover separation between `custom_icon_cache` and `resolved_icon_cache_v1`, custom icon priority, and clearing resolved icons without deleting custom icons.

- [ ] **Step 2: Run storage test and verify RED**

Run: `node --test tests\icon-storage.test.mjs`

Expected: FAIL because `core/icons/IconStorage.js` does not exist.

- [ ] **Step 3: Implement storage wrapper**

Use existing localStorage/chrome.storage-compatible object maps, but keep the new module dependency-injectable for Node tests.

- [ ] **Step 4: Run storage test and verify GREEN**

Run: `node --test tests\icon-storage.test.mjs`

Expected: PASS.

### Task 3: Local Icon Library Provider

**Files:**
- Create: `tests/icon-library-provider.test.mjs`
- Create: `core/icons/IconLibraryProvider.js`
- Create: `core/icons/generated/simple-icons.generated.js`
- Create: `scripts/generate-brand-icons.mjs`
- Create or modify: `package.json`

**Interfaces:**
- Produces: `findLibraryIcon(bookmark): IconCandidate | null`
- Produces: `searchLibraryIcons(query, options): IconCandidate[]`

- [ ] **Step 1: Write failing provider tests**

Cover domain match, title match, aliases, no ambiguous auto-apply, and source metadata.

- [ ] **Step 2: Run provider test and verify RED**

Run: `node --test tests\icon-library-provider.test.mjs`

Expected: FAIL because provider/generated data do not exist.

- [ ] **Step 3: Add generated Simple Icons data path**

Add a deterministic generated file with enough real entries to validate behavior immediately, plus a generation script for refreshing from Simple Icons.

- [ ] **Step 4: Implement provider ranking**

Prefer exact domain/slug/title matches; return null for broad ambiguous matches.

- [ ] **Step 5: Run provider test and verify GREEN**

Run: `node --test tests\icon-library-provider.test.mjs`

Expected: PASS.

### Task 4: Icon Resolver

**Files:**
- Create: `tests/icon-resolver.test.mjs`
- Create: `core/icons/IconResolver.js`

**Interfaces:**
- Produces: `resolveBookmarkIcon(bookmark, options): IconRenderModel`
- Produces: `getInitialFallback(bookmark): IconRenderModel`

- [ ] **Step 1: Write failing resolver tests**

Cover custom icon priority, resolved cache priority, library fallback, first-letter fallback, and no default favicon fetch dependency.

- [ ] **Step 2: Run resolver test and verify RED**

Run: `node --test tests\icon-resolver.test.mjs`

Expected: FAIL because resolver does not exist.

- [ ] **Step 3: Implement resolver**

Return `{ type, value, source, sourceLabel, matchReason }` models only; no DOM work.

- [ ] **Step 4: Run resolver test and verify GREEN**

Run: `node --test tests\icon-resolver.test.mjs`

Expected: PASS.

### Task 5: Component Integration

**Files:**
- Modify: `components/BookmarkCard.js`
- Modify: `components/BookmarkGrid.js`
- Modify: `components/IconStudio.js`
- Modify: `core/BookmarkStore.js`

**Interfaces:**
- Consumes: `resolveBookmarkIcon`, `sanitizeSvg`, `isSvgRaw`, icon storage wrapper.
- Produces: default rendering that uses custom > library > initial.

- [ ] **Step 1: Write or extend failing integration test**

Use `node:test` static checks to prove `BookmarkGrid` no longer schedules default favicon fetching and components import shared sanitizer/resolver.

- [ ] **Step 2: Run integration test and verify RED**

Run the new focused integration test.

- [ ] **Step 3: Update components**

Remove default favicon resolution from render path; keep explicit refresh behavior only if still exposed.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run icon tests plus toolbar/version tests.

### Task 6: Bitmap Upload Validation

**Files:**
- Create: `tests/bitmap-icon-upload.test.mjs`
- Create: `core/icons/BitmapIconProcessor.js`
- Modify: `components/BookmarkCard.js` or `components/IconStudio.js`

**Interfaces:**
- Produces: `validateBitmapDimensions(width, height): { ok: boolean, reason?: string }`
- Produces: upload flow that rejects decoded images below 256x256.

- [ ] **Step 1: Write failing bitmap validation tests**

Cover 255x256 reject, 256x255 reject, 256x256 accept, and larger images accept.

- [ ] **Step 2: Run bitmap test and verify RED**

Run: `node --test tests\bitmap-icon-upload.test.mjs`

Expected: FAIL because `BitmapIconProcessor.js` does not exist.

- [ ] **Step 3: Implement validation and wire upload path**

Use natural image dimensions and reject low-resolution images before writing to storage.

- [ ] **Step 4: Run bitmap test and verify GREEN**

Run: `node --test tests\bitmap-icon-upload.test.mjs`

Expected: PASS.

### Task 7: Final Verification And Docs

**Files:**
- Modify: `README.md` if user-facing icon behavior text changes.
- Modify: `AGENTS.md` if project icon architecture rules change.
- Modify: `docs/touch-icon-mvp-plan.md` if old favicon-first or icon-studio assumptions are stale.

**Interfaces:**
- Produces: docs aligned with implemented behavior.

- [ ] **Step 1: Update docs only where behavior changed**

Keep README user-facing and AGENTS agent-facing.

- [ ] **Step 2: Run full verification**

Run:

```powershell
node --test
node --check .\components\BookmarkCard.js
node --check .\components\BookmarkGrid.js
node --check .\components\IconStudio.js
node --check .\core\BookmarkStore.js
Get-ChildItem -Recurse -File .\core\icons,.\scripts | Where-Object { $_.Extension -in '.js','.mjs' } | ForEach-Object { node --check $_.FullName }
git diff --check
```

Expected: all pass.
