/**
 * BookmarkStore - 数据层：封装 chrome.bookmarks API + 事件监听
 */
import EventBus from './EventBus.js';

// Favicon 缓存状态标记
const FAVICON_FAILED = '__FAILED__';

class BookmarkStore {
  constructor() {
    // 缓存
    this.cache = new Map();
    this.tree = null;

    // Favicon 缓存：内存 + localStorage 双层
    this.faviconCache = null; // 延迟加载
    this.faviconStorageKey = 'favicon_cache_v2';
    // 用户自定义图标缓存
    this.customIconStorageKey = 'custom_icon_cache';
    this.customIcons = null; // 延迟加载
    // 正在获取中的 favicon 请求去重
    this.faviconPending = new Map();

    // 监听 Chrome 书签变更
    this.setupListeners();
  }

  setupListeners() {
    chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
      this.invalidateCache();
      EventBus.emit('created', bookmark);
    });

    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      this.invalidateCache();
      EventBus.emit('removed', { id, ...removeInfo });
    });

    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      this.invalidateCache();
      EventBus.emit('changed', { id, ...changeInfo });
    });

    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      this.invalidateCache();
      EventBus.emit('moved', { id, ...moveInfo });
    });

    chrome.bookmarks.onChildrenReordered.addListener((id, reorderInfo) => {
      this.invalidateCache();
      EventBus.emit('childrenReordered', { id, ...reorderInfo });
    });
  }

  invalidateCache() {
    this.cache.clear();
    this.tree = null;
  }

  // ========== 书签树操作 ==========

  /**
   * 获取书签树
   */
  async getTree() {
    if (!this.tree) {
      this.tree = await chrome.bookmarks.getTree();
    }
    return this.tree;
  }

  /**
   * 获取节点
   * @param {string} nodeId - 节点 ID
   */
  async getNode(nodeId) {
    const tree = await this.getTree();
    return this.findNode(tree, nodeId);
  }

  findNode(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 获取子项
   * @param {string} parentId - 父节点 ID
   */
  async getChildren(parentId) {
    const cacheKey = `children:${parentId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const children = await chrome.bookmarks.getChildren(parentId);
      // 保持 Chrome API 返回的原始 index 顺序，不重排
      this.cache.set(cacheKey, children);
      return children;
    } catch (err) {
      console.error('Failed to get children:', err);
      return [];
    }
  }

  /**
   * 全局搜索
   * @param {string} query - 搜索词
   */
  async search(query) {
    if (!query) return [];
    try {
      return await chrome.bookmarks.search(query);
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  }

  // ========== Favicon 缓存系统 ==========

  /**
   * 初始化 favicon 内存缓存（从 localStorage 一次性加载）
   */
  _loadFaviconCache() {
    if (this.faviconCache !== null) return;
    this.faviconCache = new Map();
    try {
      const stored = localStorage.getItem(this.faviconStorageKey);
      if (stored) {
        const obj = JSON.parse(stored);
        for (const [key, value] of Object.entries(obj)) {
          this.faviconCache.set(key, value);
        }
      }
    } catch {
      // 缓存损坏，重建
      localStorage.removeItem(this.faviconStorageKey);
    }
  }

  /**
   * 持久化 favicon 缓存到 localStorage
   */
  _saveFaviconCache() {
    try {
      const obj = Object.fromEntries(this.faviconCache);
      localStorage.setItem(this.faviconStorageKey, JSON.stringify(obj));
    } catch {
      // localStorage 满了，清理失败项
      this._cleanupFaviconCache();
    }
  }

  /**
   * 清理失败项释放空间
   */
  _cleanupFaviconCache() {
    for (const [key, value] of this.faviconCache) {
      if (value === FAVICON_FAILED) {
        this.faviconCache.delete(key);
      }
    }
    try {
      const obj = Object.fromEntries(this.faviconCache);
      localStorage.setItem(this.faviconStorageKey, JSON.stringify(obj));
    } catch {}
  }

  // ========== 自定义图标系统 ==========

  /**
   * 初始化自定义图标缓存
   */
  _loadCustomIcons() {
    if (this.customIcons !== null) return;
    this.customIcons = new Map();
    try {
      const stored = localStorage.getItem(this.customIconStorageKey);
      if (stored) {
        const obj = JSON.parse(stored);
        for (const [key, value] of Object.entries(obj)) {
          this.customIcons.set(key, value);
        }
      }
    } catch {
      localStorage.removeItem(this.customIconStorageKey);
    }
  }

  /**
   * 设置书签自定义图标
   * @param {string} bookmarkId - 书签 ID
   * @param {string} dataUrl - PNG 图片的 data URL
   */
  setCustomIcon(bookmarkId, dataUrl) {
    this._loadCustomIcons();
    this.customIcons.set(bookmarkId, dataUrl);
    try {
      const obj = Object.fromEntries(this.customIcons);
      localStorage.setItem(this.customIconStorageKey, JSON.stringify(obj));
    } catch {}
  }

  /**
   * 移除书签自定义图标
   * @param {string} bookmarkId - 书签 ID
   */
  removeCustomIcon(bookmarkId) {
    this._loadCustomIcons();
    this.customIcons.delete(bookmarkId);
    try {
      const obj = Object.fromEntries(this.customIcons);
      localStorage.setItem(this.customIconStorageKey, JSON.stringify(obj));
    } catch {}
  }

  /**
   * 获取书签自定义图标
   * @param {string} bookmarkId - 书签 ID
   * @returns {string|null} data URL 或 null
   */
  getCustomIcon(bookmarkId) {
    this._loadCustomIcons();
    return this.customIcons.get(bookmarkId) || null;
  }

  // ========== Favicon 获取 ==========

  /**
   * 从 URL 提取域名
   */
  getDomainFromUrl(url) {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  /**
   * 同步获取已缓存的 favicon（不触发网络请求）
   * @param {string} url - 书签 URL
   * @returns {string|null} favicon URL/dataURL，或 null（未缓存），或 FAVICON_FAILED（获取失败）
   */
  getFavicon(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return null;

    this._loadFaviconCache();
    const cached = this.faviconCache.get(domain);
    if (cached === FAVICON_FAILED) return null;
    return cached || null;
  }

  /**
   * 检查 favicon 是否已确认失败（避免重复请求）
   */
  isFaviconFailed(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return true;
    this._loadFaviconCache();
    return this.faviconCache.get(domain) === FAVICON_FAILED;
  }

  /**
   * 保存 favicon 到缓存
   * @param {string} url - 书签 URL
   * @param {string} faviconUrl - favicon URL 或 data URL
   */
  saveFavicon(url, faviconUrl) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return;

    this._loadFaviconCache();
    this.faviconCache.set(domain, faviconUrl);
    this._saveFaviconCache();
  }

  /**
   * 标记 favicon 获取失败
   */
  markFaviconFailed(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return;

    this._loadFaviconCache();
    this.faviconCache.set(domain, FAVICON_FAILED);
    this._saveFaviconCache();
  }

  /**
   * 清除单个 favicon 缓存（用于刷新）
   */
  clearFavicon(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return;
    this._loadFaviconCache();
    this.faviconCache.delete(domain);
    this._saveFaviconCache();
  }

  /**
   * 异步获取 favicon（带去重、缓存和失败标记）
   * @param {string} url - 书签 URL
   * @returns {Promise<string|null>} favicon URL 或 null
   */
  async fetchFavicon(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return null;

    this._loadFaviconCache();

    // 已缓存（包括失败标记）
    const cached = this.faviconCache.get(domain);
    if (cached) {
      return cached === FAVICON_FAILED ? null : cached;
    }

    // 请求去重：如果已经在获取中，复用同一个 Promise
    if (this.faviconPending.has(domain)) {
      return this.faviconPending.get(domain);
    }

    const promise = this._doFetchFavicon(url, domain);
    this.faviconPending.set(domain, promise);

    try {
      return await promise;
    } finally {
      this.faviconPending.delete(domain);
    }
  }

  /**
   * 实际的 favicon 获取逻辑
   */
  async _doFetchFavicon(url, domain) {
    // 方式1：使用 Chrome 内置 _favicon API
    try {
      const chromeUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=256`;

      const result = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // 检查是否为有效图标（非默认的 1x1 空白）
          if (img.naturalWidth > 1 && img.naturalHeight > 1) {
            // 转为 data URL 方便缓存
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch {
              // canvas tainted, 直接用 chrome URL
              resolve(chromeUrl);
            }
          } else {
            reject(new Error('Invalid favicon'));
          }
        };
        img.onerror = reject;
        // 超时 5 秒
        setTimeout(() => reject(new Error('Timeout')), 5000);
        img.src = chromeUrl;
      });

      this.saveFavicon(url, result);
      return result;
    } catch {}

    // 方式2：Google Favicon API 回退
    try {
      const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;

      const result = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (img.naturalWidth > 1 && img.naturalHeight > 1) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 256, 256);
              resolve(canvas.toDataURL('image/png'));
            } catch {
              resolve(googleUrl);
            }
          } else {
            reject(new Error('Invalid favicon'));
          }
        };
        img.onerror = reject;
        setTimeout(() => reject(new Error('Timeout')), 5000);
        img.src = googleUrl;
      });

      this.saveFavicon(url, result);
      return result;
    } catch {}

    // 全部失败 → 标记
    this.markFaviconFailed(url);
    return null;
  }

  /**
   * 新建书签或文件夹
   * @param {string} parentId - 父节点 ID
   * @param {string} title - 标题
   * @param {string} [url] - 网址（无则为文件夹）
   */
  async create(parentId, title, url) {
    try {
      const bookmark = await chrome.bookmarks.create({
        parentId,
        title,
        ...(url && { url })
      });
      this.invalidateCache();
      return bookmark;
    } catch (err) {
      console.error('Create failed:', err);
      throw err;
    }
  }

  /**
   * 更新书签/文件夹
   * @param {string} id - 节点 ID
   * @param {string} title - 新标题
   * @param {string} [url] - 新网址
   */
  async update(id, title, url) {
    try {
      const updateInfo = { title };
      if (url !== undefined) updateInfo.url = url;
      const bookmark = await chrome.bookmarks.update(id, updateInfo);
      this.invalidateCache();
      return bookmark;
    } catch (err) {
      console.error('Update failed:', err);
      throw err;
    }
  }

  /**
   * 移动书签/文件夹
   * @param {string} id - 节点 ID
   * @param {string} parentId - 新父节点 ID
   * @param {number} [index] - 新位置
   */
  async move(id, parentId, index) {
    try {
      const moveInfo = { parentId };
      if (index !== undefined) moveInfo.index = index;
      const bookmark = await chrome.bookmarks.move(id, moveInfo);
      this.invalidateCache();
      return bookmark;
    } catch (err) {
      console.error('Move failed:', err);
      throw err;
    }
  }

  /**
   * 删除书签
   * @param {string} id - 节点 ID
   * @param {boolean} isFolder - 是否为文件夹
   */
  async remove(id, isFolder) {
    try {
      if (isFolder) {
        await chrome.bookmarks.removeTree(id);
      } else {
        await chrome.bookmarks.remove(id);
      }
      this.invalidateCache();
    } catch (err) {
      console.error('Remove failed:', err);
      throw err;
    }
  }

  /**
   * 获取文件夹树（用于移动对话框）
   * @param {string} excludeId - 排除的节点 ID（不能移动到自身或子节点）
   */
  async getFolderTree(excludeId = null) {
    const tree = await this.getTree();
    const result = [];

    const processNode = (node, path = '') => {
      if (node.id === '0') {
        // 根节点，遍历子节点
        if (node.children) {
          node.children.forEach(child => processNode(child, path));
        }
      } else if (node.id !== '2') {
        // 排除"其他书签"
        const currentPath = path ? `${path} / ${node.title}` : node.title;
        if (!node.url) {
          // 文件夹（排除自身及子孙节点）
          if (excludeId && (node.id === excludeId || this.isDescendant(node, excludeId))) {
            return;
          }
          const item = {
            id: node.id,
            title: node.title,
            path: currentPath,
            children: []
          };
          result.push(item);
          if (node.children) {
            node.children.forEach(child => {
              if (!child.url) {
                processNode(child, currentPath);
              }
            });
          }
        }
      }
    };

    processNode(tree[0], '');
    return result;
  }

  isDescendant(parent, childId) {
    if (!parent.children) return false;
    for (const child of parent.children) {
      if (child.id === childId) return true;
      if (!child.url && this.isDescendant(child, childId)) return true;
    }
    return false;
  }
}

export default new BookmarkStore();