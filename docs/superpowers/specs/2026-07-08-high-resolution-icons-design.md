# MarkPad High-Resolution Icon System Design

## Purpose

MarkPad should use a predictable, maintainable icon system instead of treating website favicons as the default visual source. The default card icon should come from a curated icon library when a reliable match exists. If no library match exists, the card should show a designed initial-letter fallback. Users can still override any card with a custom icon through SVG search or high-resolution bitmap upload.

This design replaces the earlier favicon-first behavior as the default strategy while preserving backward compatibility where needed.

## Confirmed Product Rules

- Default card icons come from an icon library.
- If the icon library cannot match a bookmark, show a first-letter fallback.
- User custom icons always have highest priority.
- Custom icons have two entry points:
  - Search and apply an SVG icon.
  - Upload a bitmap icon.
- A bitmap upload qualifies as high-resolution only when the original image is at least 256x256.
- Low-resolution bitmap uploads are rejected before storage.
- SVG icons are considered resolution-independent, but must pass sanitizer checks before rendering or storage.
- Favicons are no longer the default visual source. Existing favicon cache can remain for migration or explicit recovery, but it should not silently outrank the icon library.

## Icon Resolution Priority

The runtime resolver should use this exact priority:

1. User custom icon.
2. Confirmed or cached icon-library match.
3. First-letter fallback.

The resolver must not silently request or apply a favicon in the default path. If a future UI exposes "restore old favicon", that action should be explicit and separate from default resolution.

## High-Resolution Definition

SVG:

- Preferred for library and search results.
- Rendered as sanitized inline SVG.
- Treated as high-resolution because it scales without raster blur.

Bitmap:

- Accepted formats may include PNG, JPEG, WebP, AVIF, GIF, and ICO if the browser can decode them.
- The decoded original image must have natural width >= 256 and natural height >= 256.
- Accepted bitmaps are normalized into a square PNG data URL, preferably 256x256 for storage stability unless visual testing shows a need for 512x512.
- Images below 256x256 are rejected with a clear user-facing message.

## Architecture

### `core/icons/IconResolver.js`

Owns icon decision-making for bookmark and folder cards.

Inputs:

- Bookmark node: `id`, `title`, `url`.
- Custom icon store.
- Resolved library icon cache.
- Local icon-library provider.

Outputs:

- A normalized render model:
  - `type: "svg" | "image" | "initial"`
  - `value`
  - `source`
  - `sourceLabel`
  - `matchReason`

Rules:

- Custom icon wins.
- Library match wins over fallback.
- Initial fallback is deterministic and does not require storage.
- Resolver contains no DOM rendering code.

### `core/icons/IconLibraryProvider.js`

Owns local icon-library matching.

Responsibilities:

- Match by normalized domain, primary domain token, title token, and curated aliases.
- Return high-confidence matches only for automatic resolution.
- Return lower-confidence candidates only in the manual SVG search UI.
- Expose deterministic ranking for tests.

First implementation source:

- Simple Icons as the primary brand source.

Later source:

- Dashboard Icons for self-hosted services, dashboards, NAS apps, and developer tools.

### `core/icons/IconSearchProvider.js`

Owns manual SVG search.

Responsibilities:

- Wrap existing Iconify, iconfont, and SVG API search behavior.
- Return `IconCandidate` objects with source labels and license/source metadata.
- Keep iconfont tab automation isolated from default card rendering.

Manual search should not decide default card icons.

### `core/icons/IconSanitizer.js`

Single shared SVG sanitizer used by:

- SVG search results.
- Pasted SVG.
- Uploaded SVG files.
- Library SVG before storage or rendering if needed.

Rules:

- Remove executable or externally linked content.
- Remove `script`, `iframe`, `foreignObject`, `object`, `embed`, `link`, `style`, `image`, and unsafe `use`.
- Remove `on*` attributes.
- Remove `javascript:` and `data:` references.
- Remove external `href` and `xlink:href`.
- Reject invalid SVG parse results.

`BookmarkCard` and `IconStudio` should stop carrying duplicated sanitizer logic.

### `core/icons/IconStorage.js`

Separates automatic and manual state.

Storage keys:

- `custom_icon_cache`: user-selected SVG or uploaded bitmap, highest priority.
- `resolved_icon_cache_v1`: automatic library match metadata and sanitized SVG reference/data.

The automatic cache must be safe to clear without losing user choices. User custom icons must never be overwritten by automatic resolution.

### `components/BookmarkCard.js`

Should render an icon model from `IconResolver` rather than deciding source priority itself.

Responsibilities kept in the component:

- DOM creation.
- Applying SVG/image/initial render models.
- Context menu events.
- Visual update after icon changes.

Responsibilities moved out:

- SVG sanitization.
- Source priority logic.
- Favicon fetching as default behavior.

### `components/IconStudio.js`

Becomes a manual custom-icon tool.

UI model:

- Search SVG icon.
- Upload bitmap icon.
- Preview selected custom icon.
- Apply to current bookmark or folder.

It should not run automatic default matching. It only writes to `custom_icon_cache` after explicit user action.

## Data Model

Icon candidate:

```js
{
  id: "simple-icons:github",
  title: "GitHub",
  source: "simple-icons",
  sourceLabel: "Simple Icons",
  sourceUrl: "https://simpleicons.org/",
  license: "CC0-1.0 or source metadata",
  type: "svg",
  svg: "<svg ...></svg>",
  confidence: 1,
  matchReason: "domain:github.com"
}
```

Render model:

```js
{
  type: "svg",
  value: "<svg ...></svg>",
  source: "custom",
  sourceLabel: "Custom SVG",
  matchReason: "user-selected"
}
```

Initial fallback model:

```js
{
  type: "initial",
  value: "G",
  source: "fallback",
  sourceLabel: "Initial fallback",
  matchReason: "no-library-match"
}
```

## Icon Library Generation

MarkPad currently has no build step. To preserve that model, icon-library data should be generated by an explicit maintenance script, not required at runtime.

Recommended files:

- `scripts/generate-brand-icons.mjs`
- `core/icons/generated/brand-index.generated.js`
- `core/icons/generated/simple-icons.generated.js` or split chunks if size requires it.

The generated files should be deterministic and checked by tests.

Generation rules:

- Include source metadata.
- Include aliases only when explicit and reviewable.
- Avoid broad fuzzy aliases that could mislabel unrelated internal tools.
- Keep generated files separate from handwritten provider code.

## Library Source Policy

Phase 1:

- Use Simple Icons as the default brand icon source.
- Prefer local generated data over CDN use.
- Do not add runtime host permissions for Simple Icons CDN unless a later design explicitly approves it.

Phase 2:

- Add Dashboard Icons only after the Simple Icons path is stable and tested.
- Use it primarily for dashboard/self-hosted/tooling icons.

Manual search:

- Keep Iconify and iconfont as user-initiated search providers.
- Do not allow manual search providers to silently replace default icons.

## Migration And Compatibility

- Existing `custom_icon_cache` remains valid and continues to win.
- Existing favicon cache may remain readable only for an explicit recovery action.
- Existing cards without custom icons should resolve through library match or initial fallback.
- No storage migration should delete user custom icons.
- If automatic resolved-icon cache becomes invalid, clearing it should only force re-resolution.

## Testing Contract

Add focused Node tests:

- `tests/icon-sanitizer.test.mjs`
  - Reject invalid SVG.
  - Strip scripts, event handlers, external refs, and unsafe styles.
- `tests/icon-resolver.test.mjs`
  - Custom icon wins.
  - Library match wins over initial fallback.
  - No default favicon fetch happens.
  - Missing match returns stable initial fallback.
- `tests/icon-library-provider.test.mjs`
  - Domain and title matching are deterministic.
  - Ambiguous low-confidence matches are not auto-applied.
  - Alias fixtures behave as expected.
- `tests/bitmap-icon-upload.test.mjs`
  - Images below 256x256 are rejected.
  - Images at or above 256x256 are accepted and normalized.
- `tests/icon-storage.test.mjs`
  - Automatic cache and custom cache remain separate.
  - Clearing automatic cache does not remove custom icons.

Existing checks still apply:

- `node --check` for changed JavaScript files.
- `node --test` for the focused test suite.
- `node --test tests/version-system.test.mjs` if version or changelog files change.
- `git diff --check`.
- UTF-8/mojibake check after Chinese Markdown or UI text edits.

## Implementation Phases

### Phase 1: Core Boundary Refactor

- Add shared sanitizer.
- Add icon candidate/render model helpers.
- Add storage boundary for custom and resolved icons.
- Update `BookmarkCard` and `IconStudio` to use shared sanitizer without changing visible behavior yet.
- Add sanitizer and storage tests.

### Phase 2: Default Library Resolution

- Add Simple Icons generation script and generated index.
- Add `IconLibraryProvider`.
- Add `IconResolver`.
- Change default card rendering to custom icon > library icon > initial.
- Stop default favicon fetching in `BookmarkGrid`.
- Add resolver/provider tests.

### Phase 3: Manual Customization Cleanup

- Split manual SVG search behavior into `IconSearchProvider`.
- Keep Iconify/iconfont/SVG API behind the manual search UI.
- Add bitmap upload validation with the 256x256 rule.
- Update icon studio copy so users understand the two custom paths.

### Phase 4: Optional Source Expansion

- Evaluate Dashboard Icons package size and metadata quality.
- Add it only if Simple Icons does not cover enough real MarkPad bookmarks.
- Add source-specific ranking and tests before enabling it by default.

## Non-Goals

- No AI-generated icons.
- No model API keys.
- No automatic fuzzy replacement from remote search sources.
- No broad rename of existing `Bookmark*` classes or storage keys.
- No new runtime build requirement for ordinary extension use.
- No automatic deletion of favicon cache in this design.

## Acceptance Criteria

- Default icon source is the local icon library.
- Unmatched bookmarks show a polished initial fallback.
- User custom icons override defaults.
- SVG custom icons are sanitized through one shared module.
- Bitmap custom icons below 256x256 are rejected.
- Default card rendering does not fetch favicons.
- Existing custom icons still render.
- Focused tests cover sanitizer, resolver priority, provider matching, bitmap validation, and cache separation.
