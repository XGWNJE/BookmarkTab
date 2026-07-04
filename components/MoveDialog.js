/**
 * MoveDialog - 移动书签目标选择弹窗
 */
import EventBus from '../core/EventBus.js';
import BookmarkStore from '../core/BookmarkStore.js';
import { iconSvg } from '../core/IconLibrary.js';

class MoveDialog {
  constructor() {
    this.dialog = document.getElementById('move-dialog');
    this.treeContainer = document.getElementById('move-dialog-tree');
    this.confirmBtn = document.getElementById('move-dialog-confirm');
    this.currentId = null;
    this.selectedTargetId = null;

    this.init();
  }

  init() {
    // 关闭
    this.dialog.querySelectorAll('[data-action="close"], [data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    this.dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      this.hide();
    });

    // 确认
    this.confirmBtn.addEventListener('click', () => this.confirm());

    // 键盘
    document.addEventListener('keydown', (e) => {
      if (!this.dialog.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          this.hide();
        }
      }
    });

    // 监听右键菜单"移动到..."事件
    EventBus.on('card:move', ({ id }) => this.show(id));
  }

  async show(id) {
    this.currentId = id;
    this.selectedTargetId = null;

    // 获取文件夹树
    const folders = await BookmarkStore.getFolderTree(id);

    // 渲染树
    this.treeContainer.innerHTML = '';
    this.renderFolderTree(folders, this.treeContainer, 0);

    this.dialog.classList.remove('hidden');
  }

  renderFolderTree(folders, container, depth) {
    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = 'folder-tree-item';
      item.style.paddingLeft = `${depth * 20 + 12}px`;
      item.setAttribute('data-id', folder.id);

      const icon = document.createElement('span');
      icon.className = 'folder-icon';
      icon.innerHTML = iconSvg('folder');

      const name = document.createElement('span');
      name.className = 'folder-name';
      name.textContent = folder.title;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        this.treeContainer.querySelectorAll('.folder-tree-item').forEach(el => {
          el.classList.remove('selected');
        });
        item.classList.add('selected');
        this.selectedTargetId = folder.id;
      });

      container.appendChild(item);

      if (folder.children && folder.children.length > 0) {
        this.renderFolderTree(folder.children, container, depth + 1);
      }
    });
  }

  async confirm() {
    if (!this.selectedTargetId) return;

    await BookmarkStore.move(this.currentId, this.selectedTargetId);
    this.hide();
  }

  hide() {
    this.dialog.classList.add('hidden');
    this.currentId = null;
    this.selectedTargetId = null;
  }
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .folder-tree-item {
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    cursor: pointer;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .folder-tree-item:hover {
    background: var(--color-bg-soft);
    color: var(--text-primary);
  }
  .folder-tree-item.selected {
    background: var(--color-action);
    color: var(--color-action-text);
  }
  .folder-tree-item .folder-icon {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }
  .folder-tree-item .folder-icon .app-icon {
    width: 16px;
    height: 16px;
  }
  .folder-tree-item .folder-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }
`;
document.head.appendChild(style);

export default MoveDialog;
