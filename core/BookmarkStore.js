/**
 * BookmarkStore - 数据层：封装 chrome.bookmarks API + 事件监听
 */
import EventBus from './EventBus.js';

class BookmarkStore {
  constructor() {
    // 缓存
    this.cache = new Map();
    this.tree = null;
    this.faviconCache = new Map(); // 内存缓存
    this.faviconStorageKey = 'favicon_cache';

    // 监听 Chrome 书签变更
    this.setupListeners();
  }

  setupListeners() {
    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
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
      // 排序：文件夹在前，书签在后
      children.sort((a, b) => {
        const aIsFolder = !a.url;
        const bIsFolder = !b.url;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.index - b.index;
      });
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

  /**
   * 获取 favicon（带缓存）
   * @param {string} url - 书签 URL
   */
  getFavicon(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return null;

    // 先检查内存缓存
    if (this.faviconCache.has(domain)) {
      return this.faviconCache.get(domain);
    }

    // 从 localStorage 加载
    const stored = localStorage.getItem(this.faviconStorageKey);
    if (stored) {
      try {
        const cache = JSON.parse(stored);
        if (cache[domain]) {
          this.faviconCache.set(domain, cache[domain]);
          return cache[domain];
        }
      } catch {}
    }

    return null;
  }

  /**
   * 保存 favicon 到缓存
   * @param {string} url - 书签 URL
   * @param {string} dataUrl - favicon data URL
   */
  saveFavicon(url, dataUrl) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return;

    this.faviconCache.set(domain, dataUrl);

    // 持久化到 localStorage
    try {
      const stored = localStorage.getItem(this.faviconStorageKey);
      const cache = stored ? JSON.parse(stored) : {};
      cache[domain] = dataUrl;
      localStorage.setItem(this.faviconStorageKey, JSON.stringify(cache));
    } catch {}
  }

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
   * 异步获取 favicon（带缓存和回退）
   * @param {string} url - 书签 URL
   */
  async fetchFavicon(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return null;

    // 如果已有缓存，直接返回
    if (this.faviconCache.has(domain)) {
      return this.faviconCache.get(domain);
    }

    try {
      // 使用 chrome.favicon API 获取
      const faviconUrl = await chrome.favicon.getFaviconUrl(url);
      if (faviconUrl) {
        this.saveFavicon(url, faviconUrl);
        return faviconUrl;
      }
    } catch {}

    // 回退到 Google Favicon API
    try {
      const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      this.saveFavicon(url, googleUrl);
      return googleUrl;
    } catch {
      return null;
    }
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
          // 文件夹
          const isExcluded = excludeId && (
            node.id === excludeId ||
            (excludeId && this.isDescendant(node, excludeId))
          );
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