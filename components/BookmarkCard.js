/**
 * BookmarkCard - 单个卡片（书签 + 文件夹通用）
 */
import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';

/** 判断存储值是否为原始 SVG 文本 */
const isSvgRaw = (val) => typeof val === 'string' && val.trimStart().startsWith('<');

/** 将原始 SVG 文本应用到容器元素（注入 DOM，绕过 CSP） */
function applySvgToElement(el, svgText) {
  el.style.backgroundImage = '';
  el.style.backgroundSize = '';
  el.innerHTML = svgText;
  const svgEl = el.querySelector('svg');
  if (svgEl) {
    svgEl.style.cssText = 'width:100%;height:100%;display:block;';
  }
}

/** 将 background-image 图标应用到容器元素 */
function applyImageToElement(el, url) {
  el.innerHTML = '';
  el.style.backgroundImage = `url(${url})`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat = 'no-repeat';
}

class BookmarkCard {
  constructor(data, container) {
    this.data = data;
    this.container = container;
    this.element = null;
    this.isFolder = !data.url;
    this.selected = false;
    this.dragOver = false;
    this.isEditing = false;
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
      const customIcon = BookmarkStore.getCustomIcon(this.data.id);
      if (customIcon) {
        if (isSvgRaw(customIcon)) {
          applySvgToElement(icon, customIcon);
        } else {
          applyImageToElement(icon, customIcon);
        }
      } else {
        icon.classList.add('folder-default');
      }
    } else {
      icon.classList.add('favicon');

      const customIcon = BookmarkStore.getCustomIcon(this.data.id);
      const cachedFavicon = customIcon ? null : BookmarkStore.getFavicon(this.data.url);
      const iconData = customIcon || cachedFavicon;

      if (iconData) {
        if (isSvgRaw(iconData)) {
          applySvgToElement(icon, iconData);
        } else {
          icon.style.backgroundImage = `url(${iconData})`;
        }
      }

      // 备用图标（favicon 未加载时显示首字母）
      const fallbackIcon = document.createElement('div');
      fallbackIcon.className = 'favicon-fallback';
      const initial = (this.data.title || '?').charAt(0).toUpperCase();
      fallbackIcon.innerHTML = `<div class="favicon-initial">${this.escapeHtml(initial)}</div>`;
      fallbackIcon.style.display = iconData ? 'none' : 'flex';
      icon.appendChild(fallbackIcon);
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  bindEvents() {
    // 点击打开
    this.element.addEventListener('click', (e) => {
      if (this.isEditing) return;
      if (e.ctrlKey || e.metaKey) {
        this.toggleSelect();
      } else {
        this.open();
      }
    });

    // 双击编辑标题
    this.element.addEventListener('dblclick', () => {
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
      EventBus.emit('card:dragstart', { id: this.data.id, isFolder: this.isFolder });
    });

    this.element.addEventListener('dragend', () => {
      this.element.classList.remove('is-dragging');
      this.element.classList.remove('drag-over');
      EventBus.emit('card:dragend', { id: this.data.id });
    });

    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const draggedId = e.dataTransfer.types.includes('text/plain') ? true : false;
      if (!draggedId) return;

      this.clearDropIndicator();

      if (this.isFolder) {
        const rect = this.element.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const zone = y / rect.height;

        if (zone < 0.25) {
          this.showDropIndicator('before');
        } else if (zone > 0.75) {
          this.showDropIndicator('after');
        } else {
          this.element.classList.add('drag-over');
        }
      } else {
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const half = x / rect.width;

        if (half < 0.5) {
          this.showDropIndicator('before');
        } else {
          this.showDropIndicator('after');
        }
      }
    });

    this.element.addEventListener('dragleave', (e) => {
      if (!this.element.contains(e.relatedTarget)) {
        this.element.classList.remove('drag-over');
        this.clearDropIndicator();
      }
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === this.data.id) {
        this.clearDropIndicator();
        this.element.classList.remove('drag-over');
        return;
      }

      const dropPosition = this.element.dataset.dropPosition;
      this.clearDropIndicator();
      this.element.classList.remove('drag-over');

      if (this.isFolder && !dropPosition) {
        EventBus.emit('card:drop', {
          draggedId,
          targetId: this.data.id,
          action: 'into'
        });
      } else {
        EventBus.emit('card:drop', {
          draggedId,
          targetId: this.data.id,
          action: 'reorder',
          position: dropPosition || 'after'
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

    // 右键菜单
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
  }

  open() {
    if (this.isFolder) {
      EventBus.emit('card:openFolder', { id: this.data.id, title: this.data.title });
    } else {
      const openInCurrent = localStorage.getItem('openMode') === 'current';
      if (openInCurrent) {
        chrome.tabs.update({ url: this.data.url });
      } else {
        chrome.tabs.create({ url: this.data.url, active: false });
      }
    }
  }

  showDropIndicator(position) {
    this.clearDropIndicator();
    this.element.dataset.dropPosition = position;
    const indicator = document.createElement('div');
    indicator.className = `drop-indicator ${position === 'before' ? 'left' : 'right'}`;
    this.element.appendChild(indicator);
  }

  clearDropIndicator() {
    delete this.element.dataset.dropPosition;
    this.element.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    this.element.classList.remove('drag-over');
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
    this.isEditing = true;
    titleEl.contentEditable = 'true';
    titleEl.focus();

    const range = document.createRange();
    range.selectNodeContents(titleEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishEdit = async () => {
      this.isEditing = false;
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
      e.stopPropagation();
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

  // ========== 右键菜单 ==========

  showContextMenu(x, y) {
    document.querySelectorAll('.context-menu').forEach(el => el.remove());

    const menu = document.createElement('div');
    menu.className = 'context-menu';

    const hasCustomIcon = BookmarkStore.getCustomIcon(this.data.id);

    const items = [
      {
        label: '重命名',
        action: () => {
          const titleEl = this.element.querySelector('.card-title');
          this.startEdit(titleEl);
        }
      },
      ...(!this.isFolder ? [{
        label: '刷新图标',
        action: () => this.refreshFavicon()
      }] : []),
      {
        label: hasCustomIcon ? '更换图标...' : '自定义图标...',
        action: () => this.pickCustomIcon(x, y)
      },
    ];

    if (hasCustomIcon) {
      items.push({
        label: '恢复默认图标',
        action: () => this.removeCustomIcon()
      });
    }

    items.forEach(item => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'context-menu-separator';
        menu.appendChild(sep);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = `context-menu-item ${item.className || ''}`;
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          menu.remove();
          item.action();
        });
        menu.appendChild(menuItem);
      }
    });

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    document.body.appendChild(menu);

    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 8}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 8}px`;
      }
    });

    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('contextmenu', closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
      document.addEventListener('contextmenu', closeMenu);
    }, 0);
  }

  /**
   * 选择自定义图标
   * 弹出选择方式：文件选择 或 粘贴 SVG 代码
   */
  pickCustomIcon(x = 0, y = 0) {
    // 弹出选择方式菜单
    const picker = document.createElement('div');
    picker.className = 'context-menu';
    picker.innerHTML = `
      <div class="context-menu-item" data-action="file">从文件选择</div>
      <div class="context-menu-item" data-action="svg">粘贴 SVG 代码</div>
    `;

    picker.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:3000;`;
    document.body.appendChild(picker);

    requestAnimationFrame(() => {
      const pr = picker.getBoundingClientRect();
      if (pr.right > window.innerWidth)  picker.style.left = `${window.innerWidth - pr.width - 8}px`;
      if (pr.bottom > window.innerHeight) picker.style.top = `${window.innerHeight - pr.height - 8}px`;
    });

    const close = () => picker.remove();

    picker.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      close();
      if (action === 'file') this._pickFromFile();
      else if (action === 'svg') this.showSvgPasteDialog();
    });

    setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
  }

  /** 从文件选择图标 */
  _pickFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/svg+xml,image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon';

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) { console.warn('Icon file too large (max 1MB)'); return; }

      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => {
          const svgText = this.sanitizeSvg(reader.result);
          if (!svgText) return;
          BookmarkStore.setCustomIcon(this.data.id, svgText);
          this.updateIcon(svgText);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 256;
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            const scale = Math.min(size / img.width, size / img.height);
            const w = img.width * scale, h = img.height * scale;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            const dataUrl = canvas.toDataURL('image/png');
            BookmarkStore.setCustomIcon(this.data.id, dataUrl);
            this.updateIcon(dataUrl);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });

    input.click();
  }

  /** 显示 SVG 代码粘贴对话框 */
  showSvgPasteDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog';
    overlay.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content svg-paste-dialog">
        <div class="dialog-header">
          <h3>粘贴 SVG 代码</h3>
          <button class="dialog-close" data-action="close">&times;</button>
        </div>
        <div class="dialog-body">
          <textarea class="svg-paste-input form-input" rows="8"
            placeholder="将 SVG 代码粘贴到此处…&#10;&#10;<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot;>&#10;  ...&#10;</svg>"
            spellcheck="false" style="font-family:monospace;font-size:12px;resize:vertical;"></textarea>
          <div class="svg-paste-preview"></div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" data-action="cancel">取消</button>
          <button class="btn btn-primary" data-action="confirm" disabled>应用</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('.svg-paste-input');
    const preview  = overlay.querySelector('.svg-paste-preview');
    const confirmBtn = overlay.querySelector('[data-action="confirm"]');

    textarea.addEventListener('input', () => {
      const clean = this.sanitizeSvg(textarea.value.trim());
      if (clean) {
        preview.innerHTML = clean;
        const svgEl = preview.querySelector('svg');
        if (svgEl) svgEl.style.cssText = 'width:100%;height:100%;display:block;';
        confirmBtn.disabled = false;
      } else {
        preview.innerHTML = '';
        confirmBtn.disabled = true;
      }
    });

    overlay.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'confirm') {
        const clean = this.sanitizeSvg(textarea.value.trim());
        if (clean) {
          BookmarkStore.setCustomIcon(this.data.id, clean);
          this.updateIcon(clean);
        }
      }
      overlay.remove();
    });

    setTimeout(() => textarea.focus(), 50);
  }

  /**
   * 清理 SVG：去除 script、on* 事件、外部链接等安全风险
   * @returns {string|null} 清理后的 SVG，非法输入返回 null
   */
  sanitizeSvg(raw) {
    if (!raw || !raw.trimStart().startsWith('<')) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'image/svg+xml');
      // DOMParser 解析失败时会返回一个包含 <parsererror> 的文档
      if (doc.querySelector('parsererror')) return null;
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return null;

      // 移除危险元素
      svgEl.querySelectorAll('script, iframe, foreignObject').forEach(el => el.remove());
      // 移除 on* 事件属性和危险链接
      svgEl.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
          if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
          if (attr.name === 'href' && /^(javascript|data)/i.test(attr.value)) el.removeAttribute(attr.name);
        });
      });

      return svgEl.outerHTML;
    } catch {
      return null;
    }
  }

  /**
   * 移除自定义图标，恢复默认
   */
  removeCustomIcon() {
    BookmarkStore.removeCustomIcon(this.data.id);
    if (this.isFolder) {
      // 文件夹：恢复默认 SVG
      this.updateIcon(null);
    } else {
      // 书签：恢复 favicon 或首字母
      const cachedFavicon = BookmarkStore.getFavicon(this.data.url);
      this.updateIcon(cachedFavicon || null);
    }
  }

  /**
   * 刷新书签图标（清除缓存后重新获取）
   */
  async refreshFavicon() {
    const iconEl = this.element.querySelector('.card-icon');
    const fallbackEl = iconEl?.querySelector('.favicon-fallback');

    // 闪烁提示：隐藏旧图标
    if (iconEl) iconEl.style.opacity = '0';
    if (fallbackEl) fallbackEl.style.display = 'none';

    BookmarkStore.clearFavicon(this.data.url);
    BookmarkStore.removeCustomIcon(this.data.id);
    const favicon = await BookmarkStore.fetchFavicon(this.data.url);

    // 闪烁提示：显示新图标
    this.updateIcon(favicon || null);
    if (iconEl) {
      iconEl.style.transition = 'opacity 0.15s';
      iconEl.style.opacity = '1';
    }
  }

  /**
   * 更新卡片图标显示
   * @param {string|null} iconData - 原始 SVG 文本 / data URL / null（恢复默认）
   */
  updateIcon(iconData) {
    const iconEl = this.element.querySelector('.card-icon');
    if (!iconEl) return;

    if (this.isFolder) {
      if (iconData) {
        iconEl.classList.remove('folder-default');
        if (isSvgRaw(iconData)) {
          applySvgToElement(iconEl, iconData);
        } else {
          applyImageToElement(iconEl, iconData);
        }
      } else {
        // 恢复默认 CSS 色块
        iconEl.innerHTML = '';
        iconEl.style.backgroundImage = '';
        iconEl.style.backgroundSize = '';
        iconEl.classList.add('folder-default');
      }
    } else {
      const fallbackEl = iconEl.querySelector('.favicon-fallback');
      if (iconData) {
        if (isSvgRaw(iconData)) {
          applySvgToElement(iconEl, iconData);
          // SVG 注入后 fallback 被清除，不需要额外隐藏
        } else {
          iconEl.style.backgroundImage = `url(${iconData})`;
          if (fallbackEl) fallbackEl.style.display = 'none';
        }
      } else {
        iconEl.innerHTML = '';
        iconEl.style.backgroundImage = 'none';
        // 重新创建 fallback（SVG 注入时会被清除）
        const fb = document.createElement('div');
        fb.className = 'favicon-fallback';
        const initial = (this.data.title || '?').charAt(0).toUpperCase();
        fb.innerHTML = `<div class="favicon-initial">${this.escapeHtml(initial)}</div>`;
        fb.style.display = 'flex';
        iconEl.appendChild(fb);
      }
    }
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
