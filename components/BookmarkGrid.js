/**
 * BookmarkGrid - 书签网格渲染与交互
 */
import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';
import Router from '../core/Router.js';
import BookmarkCard from './BookmarkCard.js';

class BookmarkGrid {
  constructor() {
    this.grid = document.getElementById('bookmark-grid');
    this.cards = new Map();
    this.selectedCards = new Set();
    this.isLoading = false;
    this.isRefreshingFavicons = false;
    this.faviconRefreshTimeout = null;

    this.init();
  }

  init() {
    // 监听导航
    EventBus.on('navigate', async ({ id }) => {
      await this.loadFolder(id);
    });

    // 监听书签变更
    EventBus.on('created', () => this.refresh());
    EventBus.on('removed', () => this.refresh());
    EventBus.on('changed', async ({ id, title, url }) => {
      const card = this.cards.get(id);
      if (card) {
        await card.update({ title, url });
      }
    });
    EventBus.on('moved', () => this.refresh());

    // 监听卡片事件
    EventBus.on('card:openFolder', ({ id, title }) => {
      Router.push(id, title);
    });

    EventBus.on('card:delete', ({ id, isFolder }) => {
      this.deleteCard(id, isFolder);
    });

    EventBus.on('card:rename', async ({ id, title }) => {
      await BookmarkStore.update(id, title);
    });

    EventBus.on('card:select', ({ id, selected }) => {
      if (selected) {
        this.selectedCards.add(id);
      } else {
        this.selectedCards.delete(id);
      }
    });

    EventBus.on('card:drop', async ({ draggedId, targetId, action, position }) => {
      if (action === 'into') {
        // 拖入文件夹
        await BookmarkStore.move(draggedId, targetId);
      } else if (action === 'reorder') {
        // 同级排序：获取目标的实际位置
        try {
          const [targetNodes] = await Promise.all([
            chrome.bookmarks.get(targetId)
          ]);
          const targetNode = targetNodes[0];
          const [draggedNodes] = await Promise.all([
            chrome.bookmarks.get(draggedId)
          ]);
          const draggedNode = draggedNodes[0];

          let newIndex = targetNode.index;
          if (position === 'after') {
            newIndex = targetNode.index + 1;
          }
          // 如果在同一个父文件夹中，且拖拽源在目标之前，需要调整索引
          if (draggedNode.parentId === targetNode.parentId && draggedNode.index < targetNode.index) {
            newIndex = Math.max(0, newIndex - 1);
          }

          await BookmarkStore.move(draggedId, targetNode.parentId, newIndex);
        } catch (err) {
          console.error('Reorder failed:', err);
        }
      }
    });

    // 新建书签
    EventBus.on('bookmark:create', ({ parentId, title, url }) => {
      this.createBookmark(parentId, title, url);
    });

    // 新建文件夹
    EventBus.on('folder:create', ({ parentId, title }) => {
      this.createFolder(parentId, title);
    });

    // 初始加载
    this.loadFolder('1');
  }

  async loadFolder(folderId) {
    if (this.isLoading) return;
    this.isLoading = true;

    // 清空
    this.grid.innerHTML = '';
    this.cards.clear();
    this.selectedCards.clear();

    try {
      // 获取数据
      const children = await BookmarkStore.getChildren(folderId);

      // 渲染
      if (children.length === 0) {
        this.renderEmpty();
      } else {
        for (let index = 0; index < children.length; index++) {
          const child = children[index];
          const card = new BookmarkCard(child, this.grid);
          const element = await card.render();
          element.style.animationDelay = `${index * 30}ms`;
          element.classList.add('loaded');
          this.grid.appendChild(element);
          this.cards.set(child.id, card);
        }
      }
    } catch (err) {
      console.error('loadFolder failed:', err);
    } finally {
      this.isLoading = false;
      // 如果加载期间有挂起的 refresh 请求，执行它
      if (this._pendingRefreshId) {
        const pendingId = this._pendingRefreshId;
        this._pendingRefreshId = null;
        await this.loadFolder(pendingId);
        return;
      }
    }

    // 导航变化后刷新缺失的 favicon
    this.scheduleFaviconRefresh();
  }

  scheduleFaviconRefresh() {
    // 取消之前的刷新任务
    if (this.faviconRefreshTimeout) {
      clearTimeout(this.faviconRefreshTimeout);
      this.faviconRefreshTimeout = null;
    }

    // 如果正在刷新，跳过
    if (this.isRefreshingFavicons) {
      return;
    }

    // 延迟 500ms 后开始刷新（导航变化后的稳定期）
    this.faviconRefreshTimeout = setTimeout(() => {
      this.refreshMissingFavicons();
    }, 500);
  }

  async refreshMissingFavicons() {
    // 防止重复执行
    if (this.isRefreshingFavicons) {
      return;
    }
    this.isRefreshingFavicons = true;

    const cards = Array.from(this.cards.values()).filter(card => !card.isFolder);

    // 筛选需要获取 favicon 的卡片
    const needFetch = cards.filter(card => {
      // 已有自定义图标，跳过
      if (BookmarkStore.getCustomIcon(card.data.id)) return false;
      // 已有缓存，跳过
      if (BookmarkStore.getFavicon(card.data.url)) return false;
      // 已确认失败，跳过
      if (BookmarkStore.isFaviconFailed(card.data.url)) return false;
      return true;
    });

    // 分批并行获取（每批 5 个，避免同时请求过多）
    const batchSize = 5;
    for (let i = 0; i < needFetch.length; i += batchSize) {
      const batch = needFetch.slice(i, i + batchSize);
      await Promise.all(batch.map(async (card) => {
        const faviconUrl = await BookmarkStore.fetchFavicon(card.data.url);
        if (faviconUrl) {
          card.updateIcon(faviconUrl);
        }
      }));
    }

    this.isRefreshingFavicons = false;
  }

  async refresh() {
    const current = Router.getCurrent();
    if (!current) return;

    // 如果正在加载，等待当前加载完成后重新加载
    if (this.isLoading) {
      this._pendingRefreshId = current.id;
      return;
    }

    await this.loadFolder(current.id);
  }

  renderEmpty() {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">📂</div>
      <div class="empty-text">文件夹为空</div>
      <div class="empty-hint">点击"新建书签"添加第一个书签</div>
    `;
    this.grid.appendChild(empty);
  }

  async createBookmark(parentId, title, url) {
    try {
      const bookmark = await BookmarkStore.create(parentId, title, url);
      await this.refresh();
      return bookmark;
    } catch (err) {
      console.error('Failed to create bookmark:', err);
    }
  }

  async createFolder(parentId, title) {
    try {
      const folder = await BookmarkStore.create(parentId, title);
      await this.refresh();
      return folder;
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }

  async deleteCard(id, isFolder) {
    const card = this.cards.get(id);
    if (!card) return;

    // 确认动效
    card.animateShake();

    // 1秒后可撤销，暂时不做，只删除
    setTimeout(async () => {
      await card.animateDelete();
      await BookmarkStore.remove(id, isFolder);
      this.cards.delete(id);
      this.selectedCards.delete(id);
    }, 1000);
  }

  clearSelection() {
    this.selectedCards.forEach(id => {
      const card = this.cards.get(id);
      if (card) {
        card.selected = false;
        card.element.classList.remove('selected');
      }
    });
    this.selectedCards.clear();
  }

  selectAll() {
    this.cards.forEach((card, id) => {
      if (!card.isFolder) {
        card.selected = true;
        card.element.classList.add('selected');
        this.selectedCards.add(id);
      }
    });
  }

  deleteSelected() {
    this.selectedCards.forEach(async (id) => {
      const card = this.cards.get(id);
      if (card) {
        await BookmarkStore.remove(id, card.isFolder);
      }
    });
    this.refresh();
  }
}

export default BookmarkGrid;