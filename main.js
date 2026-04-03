/**
 * main.js - 入口：初始化、事件总线、全局快捷键
 */
import EventBus from './core/EventBus.js';
import Router from './core/Router.js';
import BookmarkGrid from './components/BookmarkGrid.js';
import Breadcrumb from './components/Breadcrumb.js';
import Toolbar from './components/Toolbar.js';
import EditDialog from './components/EditDialog.js';
import MoveDialog from './components/MoveDialog.js';
import QuickFind from './components/QuickFind.js';
import SettingsPanel from './components/SettingsPanel.js';

class App {
  constructor() {
    this.grid = null;
    this.init();
  }

  init() {
    // 初始化组件
    this.grid = new BookmarkGrid();
    new Breadcrumb();
    new Toolbar();
    new EditDialog();
    new MoveDialog();
    new QuickFind();
    new SettingsPanel();

    // 全局快捷键
    this.bindKeyboardShortcuts();

    // 快捷键提示
    this.bindShortcutsHint();

    // 全局拖拽
    this.bindGlobalDrag();

    // 视图模式
    EventBus.on('settings:viewMode', (mode) => {
      this.grid.setViewMode(mode);
    });
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 忽略输入框中的按键
      if (e.target.tagName === 'INPUT' || e.target.contentEditable === 'true') {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // N - 新建书签
      if (key === 'n' && !ctrl && !shift) {
        e.preventDefault();
        EventBus.emit('toolbar:newBookmark');
      }

      // Shift+N - 新建文件夹
      if (key === 'n' && !ctrl && shift) {
        e.preventDefault();
        EventBus.emit('toolbar:newFolder');
      }

      // Ctrl+F 或 / - 搜索
      if ((ctrl && key === 'f') || key === '/') {
        e.preventDefault();
        EventBus.emit('toolbar:search');
      }

      // Backspace 或 Alt+← - 返回
      if (key === 'backspace' || (key === 'arrowleft' && e.altKey)) {
        if (Router.canBack()) {
          e.preventDefault();
          Router.back();
        }
      }

      // G - 切换视图
      if (key === 'g' && !ctrl) {
        e.preventDefault();
        const current = this.grid.viewMode;
        const next = current === 'grid' ? 'list' : 'grid';
        this.grid.setViewMode(next);
        EventBus.emit('settings:viewMode', next);
      }

      // Escape - 关闭弹窗
      if (key === 'escape') {
        // 关闭所有弹窗
        document.querySelectorAll('.dialog, .settings-panel, .quick-find').forEach(el => {
          el.classList.add('hidden');
        });
      }

      // 方向键导航
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        this.navigateCards(key);
      }
    });
  }

  navigateCards(direction) {
    const cards = Array.from(document.querySelectorAll('.bookmark-card'));
    if (cards.length === 0) return;

    const focused = document.querySelector('.bookmark-card:focus');
    let index = focused ? cards.indexOf(focused) : 0;

    switch (direction) {
      case 'arrowup':
        index = Math.max(0, index - 4); // 假设4列
        break;
      case 'arrowdown':
        index = Math.min(cards.length - 1, index + 4);
        break;
      case 'arrowleft':
        index = Math.max(0, index - 1);
        break;
      case 'arrowright':
        index = Math.min(cards.length - 1, index + 1);
        break;
    }

    cards[index]?.focus();
  }

  bindShortcutsHint() {
    const hint = document.getElementById('shortcuts-hint');
    let showTimeout;

    document.addEventListener('mousemove', (e) => {
      if (e.clientX < 30 && e.clientY > window.innerHeight - 80) {
        clearTimeout(showTimeout);
        showTimeout = setTimeout(() => {
          hint.classList.add('visible');
        }, 300);
      } else {
        clearTimeout(showTimeout);
        hint.classList.remove('visible');
      }
    });
  }

  bindGlobalDrag() {
    let dragCounter = 0;

    document.addEventListener('dragenter', () => {
      dragCounter++;
      document.querySelector('.bookmark-grid')?.classList.add('drag-active');
    });

    document.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter === 0) {
        document.querySelector('.bookmark-grid')?.classList.remove('drag-active');
      }
    });

    document.addEventListener('drop', () => {
      dragCounter = 0;
      document.querySelector('.bookmark-grid')?.classList.remove('drag-active');
    });
  }

}

// 启动
new App();