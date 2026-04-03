/**
 * Router - 导航层：当前路径状态、history 管理
 */
import EventBus from './EventBus.js';

class Router {
  constructor() {
    // 导航栈
    this.stack = [{ id: '1', title: '书签栏' }];
    this.currentIndex = 0;

    // 初始化
    this.init();
  }

  init() {
    // 替换初始历史状态，确保所有历史都有统一的 state 格式
    history.replaceState({ index: 0 }, '', location.href);

    // 监听浏览器返回/前进
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.index !== undefined) {
        this.currentIndex = e.state.index;
        EventBus.emit('navigate', this.getCurrent());
      }
    });
  }

  /**
   * 获取当前位置
   */
  getCurrent() {
    return this.stack[this.currentIndex];
  }

  /**
   * 获取完整路径
   */
  getPath() {
    return this.stack.slice(0, this.currentIndex + 1);
  }

  /**
   * 进入文件夹
   * @param {string} id - 文件夹 ID
   * @param {string} title - 文件夹标题
   */
  push(id, title) {
    // 如果不是当前层，先清空前进栈
    if (this.currentIndex < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.currentIndex + 1);
    }

    this.stack.push({ id, title });
    this.currentIndex++;

    // 添加浏览器历史
    history.pushState({ index: this.currentIndex }, '', `#${id}`);

    EventBus.emit('navigate', this.getCurrent());
  }

  /**
   * 返回上级
   */
  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      history.back();
    }
  }

  /**
   * 跳转到指定索引
   * @param {number} index - 栈索引
   */
  goToIndex(index) {
    if (index >= 0 && index < this.stack.length && index !== this.currentIndex) {
      this.currentIndex = index;
      history.replaceState({ index }, '', `#${this.getCurrent().id}`);
      EventBus.emit('navigate', this.getCurrent());
    }
  }

  /**
   * 是否能返回
   */
  canBack() {
    return this.currentIndex > 0;
  }

  /**
   * 是否能前进
   */
  canForward() {
    return this.currentIndex < this.stack.length - 1;
  }
}

export default new Router();