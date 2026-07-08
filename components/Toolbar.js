/**
 * Toolbar - 顶部工具栏
 */
import EventBus from '../core/EventBus.js';

class Toolbar {
  constructor() {
    this.element = document.getElementById('toolbar');
    this.menuPanel = document.getElementById('menu-panel');
    this.menuTrigger = document.getElementById('menu-trigger');
    this.init();
  }

  init() {
    this.bindAction('menu-new-bookmark', 'toolbar:newBookmark', { closeMenu: true });
    this.bindAction('menu-new-folder', 'toolbar:newFolder', { closeMenu: true });
    this.bindAction('btn-search', 'toolbar:search', { closeMenu: true });
  }

  bindAction(id, eventName, options = {}) {
    const button = document.getElementById(id);
    if (!button) return;

    button.addEventListener('click', () => {
      if (options.closeMenu) {
        this.closeMenuPanel();
      }
      EventBus.emit(eventName);
    });
  }

  closeMenuPanel() {
    this.menuPanel?.classList.remove('visible');
    this.menuTrigger?.classList.remove('active');
    this.menuTrigger?.setAttribute('aria-expanded', 'false');
  }
}

export default Toolbar;
