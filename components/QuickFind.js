/**
 * QuickFind - 快速查找（全局搜索）
 */
import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';

class QuickFind {
  constructor() {
    this.dialog = document.getElementById('quick-find');
    this.input = document.getElementById('quick-find-input');
    this.resultsContainer = document.getElementById('quick-find-results');
    this.selectedIndex = -1;
    this.results = [];
    this.searchTimeout = null;

    this.init();
  }

  init() {
    // 打开
    EventBus.on('toolbar:search', () => this.show());

    // 搜索
    this.input.addEventListener('input', () => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.search(this.input.value);
      }, 200);
    });

    // 搜索框内部键盘事件
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrev();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.openSelected();
      }
    });

    // 点击遮罩关闭
    this.dialog.querySelector('.quick-find-overlay').addEventListener('click', () => {
      this.hide();
    });

    // 点击结果
    this.resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.quick-find-item');
      if (item) {
        const index = parseInt(item.dataset.index);
        this.openResult(this.results[index]);
      }
    });
  }

  show() {
    this.dialog.classList.remove('hidden');
    this.input.value = '';
    this.results = [];
    this.selectedIndex = -1;
    this.resultsContainer.innerHTML = '';
    this.input.focus();
  }

  hide() {
    this.dialog.classList.add('hidden');
    this.input.value = '';
  }

  async search(query) {
    if (!query.trim()) {
      this.results = [];
      this.resultsContainer.innerHTML = '';
      return;
    }

    this.results = await BookmarkStore.search(query);
    this.selectedIndex = -1;
    this.renderResults();
  }

  renderResults() {
    if (this.results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="quick-find-empty">未找到匹配的书签</div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = this.results.map((result, index) => `
      <div class="quick-find-item" data-index="${index}">
        <span class="quick-find-item-icon">${result.url ? '🔖' : '📁'}</span>
        <div class="quick-find-item-info">
          <div class="quick-find-item-title">${this.escapeHtml(result.title)}</div>
          ${result.url ? `<div class="quick-find-item-url">${this.escapeHtml(result.url)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  selectNext() {
    if (this.results.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
    this.updateSelection();
  }

  selectPrev() {
    if (this.results.length === 0) return;
    this.selectedIndex = this.selectedIndex <= 0
      ? this.results.length - 1
      : this.selectedIndex - 1;
    this.updateSelection();
  }

  updateSelection() {
    this.resultsContainer.querySelectorAll('.quick-find-item').forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    const selected = this.resultsContainer.querySelector('.quick-find-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  openSelected() {
    if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
      this.openResult(this.results[this.selectedIndex]);
    }
  }

  openResult(result) {
    if (result.url) {
      chrome.tabs.create({ url: result.url, active: false });
    }
    this.hide();
  }
}

export default QuickFind;