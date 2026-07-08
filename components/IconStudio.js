import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';
import IconSourceProvider from '../core/IconSourceProvider.js';
import { iconSvg } from '../core/IconLibrary.js';
import { getLibraryIconCandidates } from '../core/icons/IconLibraryProvider.js';
import { sanitizeSvg } from '../core/icons/IconSanitizer.js';

class IconStudio {
  constructor() {
    this.dialog = null;
    this.bookmark = null;
    this.icons = [];
    this.selectedIcon = null;
    this.searchDebounce = null;
    this.openedIconfontTabIds = new Set();
    this.isOpen = false;
    this.mode = 'remote';
    this.localCandidateContext = null;
    this.init();
  }

  init() {
    this.createDialog();
    EventBus.on('iconStudio:open', ({ bookmark }) => {
      this.show(bookmark);
    });
    EventBus.on('iconStudio:openLocal', ({ bookmark }) => {
      this.showLocal(bookmark);
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

          <div class="icon-studio-local-context hidden"></div>
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
    await this.open(bookmark, 'remote');
  }

  async showLocal(bookmark) {
    await this.open(bookmark, 'local');
  }

  async open(bookmark, mode) {
    this.bookmark = bookmark;
    this.mode = mode;
    this.icons = [];
    this.selectedIcon = null;
    this.localCandidateContext = null;
    this.isOpen = true;
    this.dialog.classList.remove('hidden');
    this.configureMode();
    this.dialog.querySelector('.icon-studio-subtitle').textContent =
      `${bookmark.title || '未命名书签'} · ${this.getHostname(bookmark.url) || '文件夹'}`;
    this.dialog.querySelector('#icon-search-input').value = mode === 'local' ? '' : this.defaultQuery(bookmark);
    this.setStatus('');
    this.renderLocalContext();
    this.renderResults();
    this.updatePreview();
    if (mode === 'local') {
      this.searchLocalCandidates();
    } else {
      this.searchManual();
    }
  }

  configureMode() {
    const isLocal = this.mode === 'local';
    this.dialog.querySelector('.dialog-header h3').textContent = isLocal ? '本地图标候选' : '图标工坊';
    this.dialog.querySelector('.icon-studio-label').textContent = isLocal ? '追加关键词筛选本地图标' : '搜索 SVG 图标';
    this.dialog.querySelector('#icon-search-input').placeholder = isLocal
      ? '可选：输入品牌、产品名或工具名'
      : '例如：code、mail、cloud、video';
    this.dialog.querySelector('.icon-studio-source-actions').classList.toggle('hidden', isLocal);
    this.dialog.querySelector('[data-action="apply"]').textContent = isLocal ? '应用本地图标' : '直接应用 SVG';
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
    if (this.mode === 'local') {
      this.searchLocalCandidates();
      return;
    }

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
          svg: sanitizeSvg(icon.svg)
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

  searchLocalCandidates() {
    const query = this.dialog.querySelector('#icon-search-input').value.trim();
    const result = getLibraryIconCandidates(this.bookmark, { query, limit: 48 });
    this.localCandidateContext = result;
    this.selectedIcon = null;
    this.updatePreview();
    this.icons = result.candidates
      .map(icon => ({
        ...icon,
        svg: sanitizeSvg(icon.svg)
      }))
      .filter(icon => icon.svg);
    this.renderLocalContext(result);
    this.renderResults();
    this.setStatus(`已从本地图标库找到 ${this.icons.length} 个候选。可查看每个候选的匹配信息，也可以输入关键词继续筛选。`);
  }

  renderResults() {
    const container = this.dialog.querySelector('.icon-studio-results');
    container.classList.toggle('local-candidates', this.mode === 'local');
    if (!this.icons.length) {
      container.innerHTML = '<div class="icon-studio-empty">暂无候选图标</div>';
      return;
    }
    if (this.mode === 'local') {
      this.renderLocalResults(container);
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

  renderLocalResults(container) {
    container.innerHTML = '';
    this.icons.forEach((icon, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-studio-local-tile';
      btn.title = icon.title;
      btn.dataset.index = String(index);

      const reasons = this.formatMatchDetails(icon.matchDetails, 4);
      btn.innerHTML = `
        <span class="icon-studio-local-art">${icon.svg}</span>
        <span class="icon-studio-local-info">
          <span class="icon-studio-local-title">${this.escapeHtml(icon.title)}</span>
          <span class="icon-studio-local-source">${this.escapeHtml(icon.slug)} · ${this.escapeHtml(icon.sourceLabel || icon.source)} · ${Math.round(icon.matchScore || 0)}</span>
          <span class="icon-studio-local-reasons">${this.escapeHtml(reasons.join(' / ') || '匹配信息不足')}</span>
        </span>
      `;
      btn.addEventListener('click', () => {
        this.selectedIcon = icon;
        this.dialog.querySelectorAll('.icon-studio-local-tile').forEach(tile => tile.classList.remove('selected'));
        btn.classList.add('selected');
        this.updatePreview();
      });
      container.appendChild(btn);
    });
  }

  renderLocalContext(result = this.localCandidateContext) {
    const panel = this.dialog.querySelector('.icon-studio-local-context');
    if (this.mode !== 'local') {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }

    const context = result || getLibraryIconCandidates(this.bookmark, { limit: 0 });
    const signals = context.signals;
    const queries = context.queries || [];
    const rows = [
      ['标题', signals.title || '无'],
      ['URL', signals.urlForDisplay || '无'],
      ['完整域名', signals.hostname || '无'],
      ['主域名', signals.primaryDomainRaw || signals.primaryDomain || '无'],
      ['标题词', signals.titleTokens.join(', ') || '无'],
      ['域名片段', signals.domainTokens.join(', ') || '无'],
      ['路径片段', signals.pathTokens.join(', ') || '无'],
      ['匹配查询', queries.map(query => `${query.sourceLabel}:${query.value}`).join(' / ') || '无']
    ];

    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="icon-studio-context-heading">匹配信息</div>
      <div class="icon-studio-context-grid">
        ${rows.map(([label, value]) => `
          <div class="icon-studio-context-row">
            <span>${this.escapeHtml(label)}</span>
            <strong>${this.escapeHtml(value)}</strong>
          </div>
        `).join('')}
      </div>
    `;
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
    preview.querySelector('.icon-studio-preview-title').textContent =
      this.mode === 'local' ? this.selectedIcon.title : (this.bookmark.title || '未命名书签');
    preview.querySelector('.icon-studio-preview-source').textContent = this.mode === 'local'
      ? `${this.selectedIcon.sourceLabel || this.selectedIcon.source} · ${this.formatMatchDetails(this.selectedIcon.matchDetails, 3).join(' / ')}`
      : `${this.selectedIcon.sourceLabel || this.selectedIcon.source} · ${this.selectedIcon.license || 'unknown license'}`;
  }

  applySelectedSvg() {
    if (!this.selectedIcon) return;
    const clean = sanitizeSvg(this.selectedIcon.svg);
    if (!clean) {
      this.setStatus('SVG 无效或包含不安全内容。', true);
      return;
    }
    BookmarkStore.setCustomIcon(this.bookmark.id, clean);
    EventBus.emit('icon:applied', {
      id: this.bookmark.id,
      iconData: clean
    });
    this.setStatus(this.mode === 'local' ? '本地图标已应用。' : 'SVG 图标已应用。');
  }

  async testIconfontAuth() {
    const query = this.dialog.querySelector('#icon-search-input').value.trim() || this.defaultQuery(this.bookmark);
    try {
      this.setStatus('正在测试 iconfont 登录授权...');
      const result = await IconSourceProvider.search(query, { limit: 8, source: 'iconfont' });
      const icons = result.icons
        .map(icon => ({ ...icon, svg: sanitizeSvg(icon.svg) }))
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

  formatMatchDetails(details = [], limit = 4) {
    return details
      .slice(0, limit)
      .map(detail => `${detail.sourceLabel}:${detail.value}（${detail.matchType}）`);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
}

export default IconStudio;
