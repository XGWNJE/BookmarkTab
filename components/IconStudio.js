import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';
import IconSourceProvider from '../core/IconSourceProvider.js';
import { iconSvg } from '../core/IconLibrary.js';

class IconStudio {
  constructor() {
    this.dialog = null;
    this.bookmark = null;
    this.icons = [];
    this.selectedIcon = null;
    this.searchDebounce = null;
    this.openedIconfontTabIds = new Set();
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createDialog();
    EventBus.on('iconStudio:open', ({ bookmark }) => {
      this.show(bookmark);
    });
  }

  createDialog() {
    this.dialog = document.createElement('div');
    this.dialog.id = 'icon-studio';
    this.dialog.className = 'dialog icon-studio hidden';
    this.dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content icon-studio-content">
        <div class="dialog-header">
          <div>
            <h3>图标工坊</h3>
            <div class="icon-studio-subtitle"></div>
          </div>
          <button class="dialog-close" data-action="close" aria-label="关闭">
            ${iconSvg('x')}
          </button>
        </div>
        <div class="icon-studio-body">
          <section class="icon-studio-section">
            <label class="icon-studio-label" for="icon-search-input">搜索 SVG 图标</label>
            <div class="icon-studio-search-row">
              <input type="text" id="icon-search-input" class="form-input" placeholder="例如：code、mail、cloud、video" autocomplete="off">
              <button class="btn btn-secondary" data-action="search">搜索</button>
            </div>
            <div class="icon-studio-source-actions">
              <button class="btn btn-secondary" data-action="open-iconfont">打开 iconfont</button>
              <button class="btn btn-secondary" data-action="test-iconfont">只看 iconfont</button>
            </div>
          </section>

          <div class="icon-studio-status"></div>
          <div class="icon-studio-results"></div>
          <div class="icon-studio-preview hidden">
            <div class="icon-studio-preview-icon"></div>
            <div class="icon-studio-preview-meta">
              <div class="icon-studio-preview-title"></div>
              <div class="icon-studio-preview-source"></div>
            </div>
          </div>
        </div>
        <div class="dialog-footer icon-studio-footer">
          <button class="btn btn-secondary" data-action="close">取消</button>
          <button class="btn btn-primary" data-action="apply" disabled>直接应用 SVG</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.dialog);
    this.bindDialogEvents();
  }

  bindDialogEvents() {
    this.dialog.querySelector('.dialog-overlay').addEventListener('click', () => this.hide());
    this.dialog.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    this.dialog.querySelector('[data-action="search"]').addEventListener('click', () => {
      this.searchManual();
    });
    this.dialog.querySelector('[data-action="open-iconfont"]').addEventListener('click', async () => {
      const query = this.dialog.querySelector('#icon-search-input').value.trim() || this.defaultQuery(this.bookmark);
      const tab = await chrome.tabs.create({ url: `https://www.iconfont.cn/search/index?searchType=icon&q=${encodeURIComponent(query)}` });
      if (tab?.id) this.openedIconfontTabIds.add(tab.id);
      this.setStatus('已打开 iconfont 搜索页。关闭图标工坊时会自动关闭由本窗口打开的 iconfont 标签页。');
    });
    this.dialog.querySelector('[data-action="test-iconfont"]').addEventListener('click', () => {
      this.testIconfontAuth();
    });
    this.dialog.querySelector('#icon-search-input').addEventListener('input', () => {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => this.searchManual(), 350);
    });
    this.dialog.querySelector('[data-action="apply"]').addEventListener('click', () => {
      this.applySelectedSvg();
    });
  }

  async show(bookmark) {
    this.bookmark = bookmark;
    this.icons = [];
    this.selectedIcon = null;
    this.isOpen = true;
    this.dialog.classList.remove('hidden');
    this.dialog.querySelector('.icon-studio-subtitle').textContent =
      `${bookmark.title || '未命名书签'} · ${this.getHostname(bookmark.url) || '文件夹'}`;
    this.dialog.querySelector('#icon-search-input').value = this.defaultQuery(bookmark);
    this.setStatus('');
    this.renderResults();
    this.updatePreview();
    this.searchManual();
  }

  async hide() {
    this.isOpen = false;
    this.dialog.classList.add('hidden');
    clearTimeout(this.searchDebounce);
    await this.closeOpenedIconfontTabs();
  }

  async closeOpenedIconfontTabs() {
    await IconSourceProvider.closeManagedIconfontTab();
    if (!globalThis.chrome?.tabs || !this.openedIconfontTabIds.size) return;

    const tabIds = [...this.openedIconfontTabIds];
    this.openedIconfontTabIds.clear();
    await Promise.allSettled(tabIds.map(async (tabId) => {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // The user may have closed it already.
      }
    }));
  }

  async searchManual() {
    const query = this.dialog.querySelector('#icon-search-input').value.trim();
    if (!query) {
      this.renderResults([]);
      return;
    }
    await this.searchIcons(query);
  }

  async searchIcons(query) {
    try {
      this.setStatus(`正在搜索 SVG：${query}`);
      this.selectedIcon = null;
      this.updatePreview();
      const result = await IconSourceProvider.search(query, { limit: 24 });
      if (!this.isOpen) {
        await this.closeOpenedIconfontTabs();
        return;
      }
      this.icons = result.icons
        .map(icon => ({
          ...icon,
          svg: this.sanitizeSvg(icon.svg)
        }))
        .filter(icon => icon.svg);
      this.renderResults();
      const sourceText = this.formatSources(this.icons);
      const noticeText = Array.isArray(result.notices) && result.notices.length ? ` ${result.notices.join(' ')}` : '';
      this.setStatus(`已找到 ${this.icons.length} 个候选图标。来源：${sourceText}。${noticeText}`);
    } catch (err) {
      this.icons = [];
      this.renderResults();
      this.setStatus(`搜索失败：${this.safeError(err)}`, true);
    }
  }

  renderResults() {
    const container = this.dialog.querySelector('.icon-studio-results');
    if (!this.icons.length) {
      container.innerHTML = '<div class="icon-studio-empty">暂无候选图标</div>';
      return;
    }
    container.innerHTML = '';
    this.icons.forEach((icon, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-studio-icon-tile';
      btn.title = icon.name;
      btn.dataset.index = String(index);
      btn.innerHTML = `
        <span class="icon-studio-icon-art">${icon.svg}</span>
        <span class="icon-studio-source-badge">${this.escapeHtml(icon.sourceLabel || icon.source)}</span>
      `;
      btn.addEventListener('click', () => {
        this.selectedIcon = icon;
        this.dialog.querySelectorAll('.icon-studio-icon-tile').forEach(tile => tile.classList.remove('selected'));
        btn.classList.add('selected');
        this.updatePreview();
      });
      container.appendChild(btn);
    });
  }

  updatePreview() {
    const preview = this.dialog.querySelector('.icon-studio-preview');
    const applyBtn = this.dialog.querySelector('[data-action="apply"]');
    applyBtn.disabled = !this.selectedIcon;

    if (!this.selectedIcon) {
      preview.classList.add('hidden');
      return;
    }

    preview.classList.remove('hidden');
    const previewIcon = preview.querySelector('.icon-studio-preview-icon');
    previewIcon.innerHTML = '';
    previewIcon.style.backgroundImage = '';
    previewIcon.innerHTML = this.selectedIcon.svg;
    preview.querySelector('.icon-studio-preview-title').textContent = this.bookmark.title || '未命名书签';
    preview.querySelector('.icon-studio-preview-source').textContent =
      `${this.selectedIcon.sourceLabel || this.selectedIcon.source} · ${this.selectedIcon.license || 'unknown license'}`;
  }

  applySelectedSvg() {
    if (!this.selectedIcon) return;
    const clean = this.sanitizeSvg(this.selectedIcon.svg);
    if (!clean) {
      this.setStatus('SVG 无效或包含不安全内容。', true);
      return;
    }
    BookmarkStore.setCustomIcon(this.bookmark.id, clean);
    EventBus.emit('icon:applied', {
      id: this.bookmark.id,
      iconData: clean
    });
    this.setStatus('SVG 图标已应用。');
  }

  async testIconfontAuth() {
    const query = this.dialog.querySelector('#icon-search-input').value.trim() || this.defaultQuery(this.bookmark);
    try {
      this.setStatus('正在测试 iconfont 登录授权...');
      const result = await IconSourceProvider.search(query, { limit: 8, source: 'iconfont' });
      const icons = result.icons
        .map(icon => ({ ...icon, svg: this.sanitizeSvg(icon.svg) }))
        .filter(icon => icon.svg);
      if (!icons.length) {
        this.setStatus(`iconfont 暂不可用：${(result.notices || []).join(' ') || '未返回 SVG'}`, true);
        return;
      }
      this.icons = icons;
      this.renderResults();
      this.setStatus(`iconfont 授权可用，已返回 ${icons.length} 个候选。`);
    } catch (err) {
      this.setStatus(`iconfont 测试失败：${this.safeError(err)}`, true);
    }
  }

  sanitizeSvg(raw) {
    if (!raw || !raw.trimStart().startsWith('<')) return null;
    try {
      const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
      if (doc.querySelector('parsererror')) return null;
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return null;
      svgEl.querySelectorAll('script, iframe, foreignObject, object, embed, link, style, image, use').forEach(el => el.remove());
      svgEl.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim();
          const normalized = value.replace(/\s+/g, '').toLowerCase();
          if (/^on/i.test(name) || /(javascript:|data:)/i.test(normalized)) {
            el.removeAttribute(attr.name);
            return;
          }
          if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#')) {
            el.removeAttribute(attr.name);
          }
        });
      });
      return svgEl.outerHTML;
    } catch {
      return null;
    }
  }

  defaultQuery(bookmark) {
    const host = this.getHostname(bookmark.url);
    const domainKeyword = this.getPrimaryDomainKeyword(host);
    if (domainKeyword) return domainKeyword;
    if (bookmark.title) return bookmark.title.split(/\s+/)[0];
    return 'bookmark';
  }

  getPrimaryDomainKeyword(host) {
    const parts = host.split('.').filter(Boolean);
    if (parts.length === 0) return '';

    const multiPartSuffixes = new Set([
      'com.cn', 'net.cn', 'org.cn', 'gov.cn',
      'co.uk', 'com.au', 'co.jp', 'com.hk'
    ]);
    const lastTwo = parts.slice(-2).join('.');
    const index = multiPartSuffixes.has(lastTwo) ? parts.length - 3 : parts.length - 2;
    const candidate = parts[Math.max(0, index)];
    return ['www', 'm', 'mobile'].includes(candidate) ? parts[0] : candidate;
  }

  getHostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  setStatus(message, isError = false) {
    const status = this.dialog.querySelector('.icon-studio-status');
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  safeError(err) {
    return String(err?.message || err).replace(/Bearer\s+[\w.-]+/g, 'Bearer [redacted]');
  }

  formatSources(icons) {
    const counts = icons.reduce((acc, icon) => {
      const key = icon.sourceLabel || icon.source || 'unknown';
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    return [...counts.entries()].map(([name, count]) => `${name} ${count}`).join(' / ') || '无';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
}

export default IconStudio;
