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
    this.viewMode = 'grid'; // 'grid' | 'list'
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

    EventBus.on('card:drop', async ({ draggedId, targetId }) => {
      await BookmarkStore.move(draggedId, targetId);
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

    this.isLoading = false;

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

    // 并行获取所有缺失的 favicon
    const promises = cards
      .filter(card => {
        const iconEl = card.element?.querySelector('.card-icon');
        if (!iconEl) return false;
        const currentBg = iconEl.style.backgroundImage;
        // 如果已有缓存的 favicon 或正在加载中，跳过
        if (BookmarkStore.getFavicon(card.data.url)) {
          return false;
        }
        return !currentBg || currentBg === 'none';
      })
      .map(async (card) => {
        const iconEl = card.element?.querySelector('.card-icon');
        const fallbackEl = iconEl?.querySelector('.favicon-fallback');
        if (!iconEl) return;

        const faviconUrl = await BookmarkStore.fetchFavicon(card.data.url);
        if (faviconUrl && iconEl) {
          iconEl.style.backgroundImage = `url(${faviconUrl})`;
          // 获取成功后隐藏 fallback 图标
          if (fallbackEl) {
            fallbackEl.style.display = 'none';
          }
        }
      });

    // 并行执行所有获取任务
    await Promise.all(promises);
    this.isRefreshingFavicons = false;
  }

  async refresh() {
    const current = Router.getCurrent();
    if (current) {
      await this.loadFolder(current.id);
    }
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

  setViewMode(mode) {
    this.viewMode = mode;
    this.grid.classList.toggle('list-view', mode === 'list');
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