/**
 * Toolbar - 顶部工具栏
 */
import EventBus from '../core/EventBus.js';
import Router from '../core/Router.js';

class Toolbar {
  constructor() {
    this.element = document.getElementById('toolbar');
    this.isVisible = false;
    this.hideTimeout = null;
    this.init();
  }

  init() {
    // 鼠标接近显示
    this.element.addEventListener('mouseenter', () => {
      this.show();
    });

    document.getElementById('app').addEventListener('mousemove', (e) => {
      if (e.clientY > 60) {
        this.scheduleHide();
      }
    });

    // 按钮事件
    document.getElementById('btn-new-bookmark').addEventListener('click', () => {
      EventBus.emit('toolbar:newBookmark');
    });

    document.getElementById('btn-new-folder').addEventListener('click', () => {
      EventBus.emit('toolbar:newFolder');
    });

    document.getElementById('btn-search').addEventListener('click', () => {
      EventBus.emit('toolbar:search');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      EventBus.emit('toolbar:settings');
    });
  }

  show() {
    clearTimeout(this.hideTimeout);
    this.element.classList.add('visible');
    this.isVisible = true;
  }

  scheduleHide() {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 500);
  }

  hide() {
    this.element.classList.remove('visible');
    this.isVisible = false;
  }
}

export default Toolbar;