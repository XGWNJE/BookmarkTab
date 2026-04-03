/**
 * BookmarkCard - 单个卡片（书签 + 文件夹通用）
 */
import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';

class BookmarkCard {
  constructor(data, container) {
    this.data = data;
    this.container = container;
    this.element = null;
    this.isFolder = !data.url;
    this.selected = false;
    this.dragOver = false;
  }

  async render() {
    this.element = document.createElement('div');
    this.element.className = 'bookmark-card';
    this.element.setAttribute('tabindex', '0');
    this.element.setAttribute('data-id', this.data.id);
    this.element.setAttribute('draggable', 'true');

    if (this.isFolder) {
      this.element.classList.add('folder');
    }

    // 图标包装
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'card-icon-wrapper';

    // 图标
    const icon = document.createElement('div');
    icon.className = 'card-icon';

    if (this.isFolder) {
      icon.classList.add('folder');
      // 果味高光玻璃 (Light Mode) + 全息镭射 (Dark Mode)
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <!-- 果味高光玻璃 (Light Mode) -->
        <g class="icon-light">
          <defs>
            <linearGradient id="mac_glass" x1="8" y1="20" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
              <stop offset="40%" stop-color="#ffffff" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5"/>
            </linearGradient>
            <linearGradient id="mac_border" x1="8" y1="20" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1"/>
            </linearGradient>
            <filter id="mac_shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.1"/>
            </filter>
          </defs>
          <path d="M9 16C9 13.7909 10.7909 12 13 12H25.5L29 16H51C53.2091 16 55 17.7909 55 20V48C55 50.2091 53.2091 52 51 52H13C10.7909 52 9 50.2091 9 48V16Z" fill="#ffffff" fill-opacity="0.4"/>
          <rect x="14" y="18" width="36" height="30" rx="2" fill="#ffffff" fill-opacity="0.8"/>
          <path d="M8 24C8 21.7909 9.79086 20 12 20H52C54.2091 20 56 21.7909 56 24V48C56 50.2091 54.2091 52 52 52H12C9.79086 52 8 50.2091 8 48V24Z" fill="url(#mac_glass)" filter="url(#mac_shadow)"/>
          <path d="M8.5 24C8.5 22.067 10.067 20.5 12 20.5H52C53.933 20.5 55.5 22.067 55.5 24V48C55.5 49.933 53.933 51.5 52 51.5H12C10.067 51.5 8.5 49.933 8.5 48V24Z" stroke="url(#mac_border)" stroke-width="1.5"/>
        </g>
        <!-- 全息镭射 (Dark Mode) -->
        <g class="icon-dark">
          <defs>
            <linearGradient id="holo_glass" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FF9A9E" stop-opacity="0.6"/>
              <stop offset="50%" stop-color="#FECFEF" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#A1C4FD" stop-opacity="0.6"/>
            </linearGradient>
            <linearGradient id="holo_border" x1="0" y1="20" x2="64" y2="52">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.1"/>
            </linearGradient>
          </defs>
          <path d="M10 15C10 13.3431 11.3431 12 13 12H25L28 15H51C52.6569 15 54 16.3431 54 18V48C54 49.6569 52.6569 51 51 51H13C11.3431 51 10 49.6569 10 48V15Z" fill="#ffffff" fill-opacity="0.15"/>
          <circle cx="32" cy="36" r="12" fill="#A1C4FD" fill-opacity="0.4" filter="blur(4px)"/>
          <path d="M9 23C9 21.3431 10.3431 20 12 20H52C53.6569 20 55 21.3431 55 23V48C55 49.6569 53.6569 51 52 51H12C10.3431 51 9 49.6569 9 48V23Z" fill="url(#holo_glass)"/>
          <path d="M9.5 23C9.5 21.6193 10.6193 20.5 12 20.5H52C53.3807 20.5 54.5 21.6193 54.5 23V48C54.5 49.3807 53.3807 50.5 52 50.5H12C10.6193 50.5 9.5 49.3807 9.5 48V23Z" stroke="url(#holo_border)" stroke-width="1"/>
          <line x1="16" y1="28" x2="30" y2="28" stroke="#ffffff" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`;
    } else {
      icon.classList.add('favicon');
      // 先尝试使用缓存的 favicon
      const cachedFavicon = BookmarkStore.getFavicon(this.data.url);
      if (cachedFavicon) {
        icon.style.backgroundImage = `url(${cachedFavicon})`;
      }
      // 备用图标容器
      const fallbackIcon = document.createElement('div');
      fallbackIcon.className = 'favicon-fallback';
      fallbackIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="fallback_grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.9"/>
          </linearGradient>
        </defs>
        <path d="M32 12L16 20V44C16 46.2091 17.7909 48 20 48H44C46.2091 48 48 46.2091 48 44V20L32 12Z" fill="url(#fallback_grad)" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="32" cy="34" r="6" fill="rgba(255,255,255,0.9)"/>
        <path d="M32 40V44" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
      fallbackIcon.style.display = cachedFavicon ? 'none' : 'flex';
      icon.appendChild(fallbackIcon);
      // 如果缓存加载失败，显示备用图标
      icon.onerror = () => {
        if (cachedFavicon) {
          icon.style.backgroundImage = 'none';
          fallbackIcon.style.display = 'flex';
        }
      };
    }

    iconWrapper.appendChild(icon);

    // 底部渐变
    const gradient = document.createElement('div');
    gradient.className = 'card-gradient';

    // 信息
    const info = document.createElement('div');
    info.className = 'card-info';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = this.data.title;
    title.title = this.data.title;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    if (this.isFolder) {
      // 异步获取子项数量
      const children = await BookmarkStore.getChildren(this.data.id);
      meta.textContent = `${children.length} 项`;
    } else {
      meta.textContent = this.getDomain(this.data.url);
    }

    info.appendChild(title);
    info.appendChild(meta);

    this.element.appendChild(iconWrapper);
    this.element.appendChild(gradient);
    this.element.appendChild(info);

    // 事件绑定
    this.bindEvents();

    return this.element;
  }

  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  bindEvents() {
    // 点击打开
    this.element.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        // 多选
        this.toggleSelect();
      } else {
        this.open();
      }
    });

    // 双击编辑标题
    this.element.addEventListener('dblclick', (e) => {
      if (!this.isFolder) {
        const titleEl = this.element.querySelector('.card-title');
        this.startEdit(titleEl);
      }
    });

    // 拖拽
    this.element.addEventListener('dragstart', (e) => {
      this.element.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', this.data.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    this.element.addEventListener('dragend', () => {
      this.element.classList.remove('is-dragging');
      this.element.classList.remove('drag-over');
    });

    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.isFolder) {
        this.element.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
      }
    });

    this.element.addEventListener('dragleave', () => {
      this.element.classList.remove('drag-over');
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      this.element.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      if (this.isFolder && draggedId !== this.data.id) {
        EventBus.emit('card:drop', {
          draggedId,
          targetId: this.data.id
        });
      }
    });

    // 键盘
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.open();
      } else if (e.key === 'Delete') {
        EventBus.emit('card:delete', { id: this.data.id, isFolder: this.isFolder });
      } else if (e.key === 'F2') {
        const titleEl = this.element.querySelector('.card-title');
        this.startEdit(titleEl);
      }
    });
  }

  open() {
    if (this.isFolder) {
      EventBus.emit('card:openFolder', { id: this.data.id, title: this.data.title });
    } else {
      chrome.tabs.create({ url: this.data.url, active: false });
    }
  }

  toggleSelect() {
    this.selected = !this.selected;
    this.element.classList.toggle('selected', this.selected);
    EventBus.emit('card:select', {
      id: this.data.id,
      selected: this.selected
    });
  }

  startEdit(titleEl) {
    titleEl.contentEditable = 'true';
    titleEl.focus();

    // 选中所有文本
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishEdit = async () => {
      titleEl.contentEditable = 'false';
      const newTitle = titleEl.textContent.trim();
      if (newTitle && newTitle !== this.data.title) {
        EventBus.emit('card:rename', {
          id: this.data.id,
          title: newTitle
        });
      }
      titleEl.textContent = newTitle || this.data.title;
    };

    titleEl.addEventListener('blur', finishEdit, { once: true });
    titleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleEl.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        titleEl.textContent = this.data.title;
        titleEl.blur();
      }
    });
  }

  async update(data) {
    this.data = { ...this.data, ...data };
    const titleEl = this.element.querySelector('.card-title');
    titleEl.textContent = this.data.title;
    titleEl.title = this.data.title;

    const metaEl = this.element.querySelector('.card-meta');
    if (this.isFolder) {
      const children = await BookmarkStore.getChildren(this.data.id);
      metaEl.textContent = `${children.length} 项`;
    } else {
      metaEl.textContent = this.getDomain(this.data.url);
    }
  }

  animateCreate() {
    this.element.classList.add('adding');
  }

  animateDelete() {
    return new Promise((resolve) => {
      this.element.classList.add('deleting');
      setTimeout(() => {
        this.element.remove();
        resolve();
      }, 300);
    });
  }

  animateShake() {
    this.element.classList.add('shake');
    setTimeout(() => {
      this.element.classList.remove('shake');
    }, 400);
  }
}

export default BookmarkCard;