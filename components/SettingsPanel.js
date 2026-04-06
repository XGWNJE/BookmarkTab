/**
 * SettingsPanel - 设置面板（壁纸偏好）
 * TODO: 壁纸系统后续重构
 */
import EventBus from '../core/EventBus.js';

class SettingsPanel {
  constructor() {
    this.panel = document.getElementById('settings-panel');
    this.wallpaperGrid = document.getElementById('wallpaper-grid');

    // 默认壁纸
    this.wallpapers = [
      { id: 'default', name: '默认渐变', type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
      { id: 'sunset', name: '日落', type: 'gradient', value: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
      { id: 'ocean', name: '海洋', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 'forest', name: '森林', type: 'gradient', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
      { id: 'dark', name: '深空', type: 'gradient', value: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' },
    ];

    this.currentWallpaper = 'default';

    this.init();
  }

  init() {
    // 打开
    EventBus.on('toolbar:settings', () => this.show());

    // 关闭
    this.panel.querySelector('.settings-overlay').addEventListener('click', () => {
      this.hide();
    });

    this.panel.querySelector('.settings-close').addEventListener('click', () => {
      this.hide();
    });

    // 渲染壁纸
    this.renderWallpapers();

    // 键盘
    document.addEventListener('keydown', (e) => {
      if (!this.panel.classList.contains('hidden') && e.key === 'Escape') {
        this.hide();
      }
    });
  }

  show() {
    this.panel.classList.remove('hidden');
  }

  hide() {
    this.panel.classList.add('hidden');
  }

  renderWallpapers() {
    this.wallpaperGrid.innerHTML = this.wallpapers.map(wp => `
      <div class="wallpaper-item ${wp.id === this.currentWallpaper ? 'active' : ''}"
           data-id="${wp.id}"
           title="${wp.name}">
        <div style="width:100%;height:100%;${wp.type === 'gradient' ? `background:${wp.value}` : `background-image:url(${wp.value})`};background-size:cover;"></div>
      </div>
    `).join('');

    // 点击切换
    this.wallpaperGrid.querySelectorAll('.wallpaper-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.setWallpaper(id);
      });
    });
  }

  setWallpaper(id) {
    this.currentWallpaper = id;
    const wp = this.wallpapers.find(w => w.id === id);
    if (!wp) return;

    const wallpaper = document.getElementById('wallpaper');
    if (wp.type === 'gradient') {
      wallpaper.style.background = wp.value;
    } else {
      wallpaper.style.backgroundImage = `url(${wp.value})`;
    }

    // 更新选中
    this.wallpaperGrid.querySelectorAll('.wallpaper-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });
  }
}

export default SettingsPanel;