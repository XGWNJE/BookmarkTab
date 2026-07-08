import IconStorage from './IconStorage.js';
import { findLibraryIcon, ICON_MATCHER_VERSION } from './IconLibraryProvider.js';
import { isSvgRaw } from './IconSanitizer.js';

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function firstCharacter(value) {
  return Array.from(String(value || '').trim())[0] || '?';
}

function customIconToModel(iconData) {
  return {
    type: isSvgRaw(iconData) ? 'svg' : 'image',
    value: iconData,
    source: 'custom',
    sourceLabel: isSvgRaw(iconData) ? 'Custom SVG' : 'Custom bitmap',
    matchReason: 'user-selected'
  };
}

function libraryIconToModel(icon) {
  return {
    type: icon.type || 'svg',
    value: icon.svg || icon.value,
    source: icon.source,
    sourceLabel: icon.sourceLabel,
    matchReason: icon.matchReason,
    matcherVersion: ICON_MATCHER_VERSION
  };
}

function isCurrentResolvedIcon(model) {
  return model?.matcherVersion === ICON_MATCHER_VERSION;
}

export function getInitialFallback(bookmark) {
  const value = firstCharacter(bookmark?.title) !== '?'
    ? firstCharacter(bookmark.title)
    : firstCharacter(getHostname(bookmark?.url));

  return {
    type: 'initial',
    value: value.toUpperCase(),
    source: 'fallback',
    sourceLabel: 'Initial fallback',
    matchReason: 'no-library-match'
  };
}

export function resolveBookmarkIcon(bookmark, options = {}) {
  const storage = options.storage || IconStorage;
  const libraryLookup = options.findLibraryIcon || findLibraryIcon;
  const bookmarkId = bookmark?.id;

  if (bookmarkId && storage?.getCustomIcon) {
    const customIcon = storage.getCustomIcon(bookmarkId);
    if (customIcon) return customIconToModel(customIcon);
  }

  if (bookmarkId && storage?.getResolvedIcon) {
    const resolvedIcon = storage.getResolvedIcon(bookmarkId);
    if (isCurrentResolvedIcon(resolvedIcon)) return resolvedIcon;
  }

  const libraryIcon = libraryLookup(bookmark);
  if (libraryIcon) {
    const model = libraryIconToModel(libraryIcon);
    if (bookmarkId && storage?.setResolvedIcon) {
      storage.setResolvedIcon(bookmarkId, model);
    }
    return model;
  }

  return getInitialFallback(bookmark);
}
