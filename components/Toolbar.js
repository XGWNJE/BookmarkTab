/**
 * Toolbar - 顶部工具栏
 */
import EventBus from '../core/EventBus.js';
import Router from '../core/Router.js';

class Toolbar {
  constructor() {
    this.element = document.getElementById('toolbar');
    this.init();
  }

  init() {
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
  }
}

export default Toolbar;
