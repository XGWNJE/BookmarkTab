/**
 * SettingsPanel - 左下角设置菜单中的壁纸偏好
 */
class SettingsPanel {
  constructor() {
    this.wallpaperGrid = document.getElementById('wallpaper-grid');
    this.storageKey = 'wallpaperId';

    // 默认壁纸
    this.wallpapers = [
      { id: 'system', name: '跟随系统', type: 'system', value: '' },
      { id: 'default', name: '默认柔光', type: 'color', value: '' },
      { id: 'mist', name: '晨雾', type: 'gradient', value: 'linear-gradient(135deg, #f3f7f4 0%, #dce9ee 48%, #d8d1c1 100%)' },
      { id: 'dusk', name: '暮色', type: 'gradient', value: 'linear-gradient(135deg, #202733 0%, #374151 45%, #6b5f73 100%)' },
      { id: 'leaf', name: '林影', type: 'gradient', value: 'linear-gradient(135deg, #eef4e8 0%, #adc7b5 52%, #6c8777 100%)' },
    ];

    this.currentWallpaper = localStorage.getItem(this.storageKey) || 'system';

    this.init();
  }

  init() {
    if (!this.wallpaperGrid) return;
    this.applyWallpaper(this.currentWallpaper);
    this.renderWallpapers();
  }

  renderWallpapers() {
    this.wallpaperGrid.innerHTML = this.wallpapers.map(wp => `
      <button class="wallpaper-item ${wp.id === this.currentWallpaper ? 'active' : ''}"
           data-id="${wp.id}"
           type="button"
           title="${wp.name}">
        <span class="wallpaper-preview" style="${this.getPreviewStyle(wp)}"></span>
      </button>
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
    const wp = this.wallpapers.find(w => w.id === id);
    if (!wp) return;

    this.currentWallpaper = id;
    localStorage.setItem(this.storageKey, id);
    this.applyWallpaper(id);

    // 更新选中
    this.wallpaperGrid.querySelectorAll('.wallpaper-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });
  }

  applyWallpaper(id) {
    const wp = this.wallpapers.find(w => w.id === id) || this.wallpapers[0];
    const wallpaper = document.getElementById('wallpaper');
    if (!wallpaper) return;

    wallpaper.style.background = '';
    wallpaper.style.backgroundImage = '';

    if (wp.type === 'system' || wp.type === 'color') {
      return;
    }

    if (wp.type === 'gradient') {
      wallpaper.style.background = wp.value;
    } else {
      wallpaper.style.backgroundImage = `url(${wp.value})`;
    }
  }

  getPreviewStyle(wp) {
    if (wp.type === 'system') {
      return 'background:linear-gradient(135deg,#e8e8ed 0 50%,#2c2c2e 50% 100%);';
    }
    if (wp.type === 'color') {
      return 'background:linear-gradient(135deg,#e8e8ed 0%,#f4f1ea 100%);';
    }
    if (wp.type === 'gradient') {
      return `background:${wp.value};`;
    }
    return `background-image:url(${wp.value});background-size:cover;`;
  }
}

export default SettingsPanel;
