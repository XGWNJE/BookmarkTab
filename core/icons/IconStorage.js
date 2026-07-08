export const CUSTOM_ICON_STORAGE_KEY = 'custom_icon_cache';
export const RESOLVED_ICON_STORAGE_KEY = 'resolved_icon_cache_v1';

class IconStorage {
  constructor(options = {}) {
    this.localStorage = options.localStorage || globalThis.localStorage || null;
    this.customKey = options.customKey || CUSTOM_ICON_STORAGE_KEY;
    this.resolvedKey = options.resolvedKey || RESOLVED_ICON_STORAGE_KEY;
  }

  getCustomIcon(bookmarkId) {
    return this.readMap(this.customKey)[bookmarkId] || null;
  }

  setCustomIcon(bookmarkId, iconData) {
    const map = this.readMap(this.customKey);
    map[bookmarkId] = iconData;
    this.writeMap(this.customKey, map);
  }

  removeCustomIcon(bookmarkId) {
    const map = this.readMap(this.customKey);
    delete map[bookmarkId];
    this.writeMap(this.customKey, map);
  }

  getResolvedIcon(bookmarkId) {
    return this.readMap(this.resolvedKey)[bookmarkId] || null;
  }

  setResolvedIcon(bookmarkId, iconModel) {
    const map = this.readMap(this.resolvedKey);
    map[bookmarkId] = iconModel;
    this.writeMap(this.resolvedKey, map);
  }

  clearResolvedIcon(bookmarkId) {
    const map = this.readMap(this.resolvedKey);
    delete map[bookmarkId];
    this.writeMap(this.resolvedKey, map);
  }

  readMap(key) {
    if (!this.localStorage) return {};
    try {
      const raw = this.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      this.localStorage.removeItem(key);
      return {};
    }
  }

  writeMap(key, map) {
    if (!this.localStorage) return;
    this.localStorage.setItem(key, JSON.stringify(map));
  }
}

export function createIconStorage(options = {}) {
  return new IconStorage(options);
}

export default createIconStorage();
