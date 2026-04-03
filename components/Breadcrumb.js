/**
 * Breadcrumb - 面包屑导航
 */
import EventBus from '../core/EventBus.js';
import Router from '../core/Router.js';

class Breadcrumb {
  constructor() {
    this.element = document.getElementById('breadcrumb');
    this.init();
  }

  init() {
    EventBus.on('navigate', () => {
      this.render();
    });
    this.render();
  }

  render() {
    const path = Router.getPath();
    this.element.innerHTML = '';

    path.forEach((item, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '/';
        this.element.appendChild(separator);
      }

      const itemEl = document.createElement('span');
      itemEl.className = 'breadcrumb-item';
      if (index === path.length - 1) {
        itemEl.classList.add('active');
      }
      itemEl.textContent = item.title;
      itemEl.setAttribute('data-index', index);

      itemEl.addEventListener('click', () => {
        Router.goToIndex(index);
      });

      this.element.appendChild(itemEl);
    });

    // 显示
    this.element.classList.add('visible');
  }
}

export default Breadcrumb;