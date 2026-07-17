import EventBus from '../core/EventBus.js';

/**
 * SettingsPanel - 设置菜单中的页面背景、书签卡片与顶部栏外观偏好
 */
class SettingsPanel {
  constructor() {
    this.wallpaperGrid = document.getElementById('wallpaper-grid');
    this.storageKey = 'wallpaperId';
    this.customImageKey = 'wallpaperCustomImage';
    this.fitKey = 'wallpaperFit';
    this.blurKey = 'wallpaperBlur';
    this.headerOpacityKey = 'headerOpacity';
    this.wallpaperOverlayOpacityKey = 'wallpaperOverlayOpacity';
    this.cardSizeKey = 'cardSize';
    this.cardTextKey = 'showCardText';
    this.cardBackgroundStrengthKey = 'cardBackgroundStrength';
    this.cardSizeMin = 80;
    this.cardSizeMax = 200;
    this.cardSizeStep = 20;
    this.maxCustomImageChars = 2400000;

    this.wallpapers = [
      { id: 'light', name: '浅色', type: 'color', value: '#fafaf7' },
      {
        id: 'silent-dawn',
        name: '晨纸',
        type: 'image',
        value: 'assets/wallpapers/silent-index-dawn-2560.png',
        preview: 'assets/wallpapers/silent-index-dawn-preview.png'
      },
      {
        id: 'silent-mist',
        name: '雾石',
        type: 'image',
        value: 'assets/wallpapers/silent-index-mist-2560.png',
        preview: 'assets/wallpapers/silent-index-mist-preview.png'
      },
      {
        id: 'silent-moss',
        name: '苔原',
        type: 'image',
        value: 'assets/wallpapers/silent-index-moss-2560.png',
        preview: 'assets/wallpapers/silent-index-moss-preview.png'
      },
      {
        id: 'silent-ink',
        name: '暮墨',
        type: 'image',
        value: 'assets/wallpapers/silent-index-ink-2560.png',
        preview: 'assets/wallpapers/silent-index-ink-preview.png'
      },
      {
        id: 'silent-forest',
        name: '深林',
        type: 'image',
        value: 'assets/wallpapers/silent-index-forest-2560.png',
        preview: 'assets/wallpapers/silent-index-forest-preview.png'
      },
      {
        id: 'silent-night',
        name: '夜蓝',
        type: 'image',
        value: 'assets/wallpapers/silent-index-night-2560.png',
        preview: 'assets/wallpapers/silent-index-night-preview.png'
      },
      { id: 'dark', name: '暗色', type: 'color', value: '#181817' },
      { id: 'custom', name: '自定义', type: 'custom', value: '' },
    ];
    this.fitModes = [
      { id: 'cover', name: '填充' },
      { id: 'contain', name: '完整' },
      { id: 'fill', name: '拉伸' },
      { id: 'center', name: '居中' },
      { id: 'tile', name: '平铺' }
    ];

    const savedWallpaper = localStorage.getItem(this.storageKey) || 'light';
    this.currentWallpaper = this.wallpapers.some(wp => wp.id === savedWallpaper) ? savedWallpaper : 'light';
    this.currentFit = localStorage.getItem(this.fitKey) || 'cover';
    this.currentBlur = Math.min(32, Math.max(0, Number(localStorage.getItem(this.blurKey) || '16')));
    this.currentHeaderOpacity = this.readPercent(this.headerOpacityKey, 94, 55, 100);
    this.currentWallpaperOverlayOpacity = this.readPercent(this.wallpaperOverlayOpacityKey, 88, 0, 100);
    this.currentCardSize = this.readNumber(this.cardSizeKey, 120, this.cardSizeMin, this.cardSizeMax);
    this.currentCardText = localStorage.getItem(this.cardTextKey) || 'false';
    this.currentCardBackgroundStrength = this.readPercent(this.cardBackgroundStrengthKey, 100, 40, 100);

    this.init();
  }

  init() {
    if (!this.wallpaperGrid) return;
    this.applyTransparency();
    this.bindTransparencyControls();
    this.bindCardControls();
    this.applyCardPreferences();
    this.applyWallpaper(this.currentWallpaper);
    this.renderWallpapers();
    this.renderCustomControls();
  }

  readPercent(key, fallback, min, max) {
    const value = Number(localStorage.getItem(key) || fallback);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  readNumber(key, fallback, min, max) {
    const value = Number(localStorage.getItem(key) || fallback);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  applyTransparency() {
    document.documentElement.style.setProperty('--toolbar-opacity', `${this.currentHeaderOpacity}%`);
    document.documentElement.style.setProperty('--toolbar-alpha', this.toAlpha(this.currentHeaderOpacity));
    document.documentElement.style.setProperty('--wallpaper-overlay-opacity', `${this.currentWallpaperOverlayOpacity}%`);
    document.documentElement.style.setProperty('--wallpaper-overlay-alpha', this.toAlpha(this.currentWallpaperOverlayOpacity));
  }

  toAlpha(percent) {
    return (percent / 100).toFixed(2);
  }

  bindTransparencyControls() {
    this.bindPercentControl({
      input: document.getElementById('header-opacity'),
      value: document.getElementById('header-opacity-value'),
      storageKey: this.headerOpacityKey,
      getCurrent: () => this.currentHeaderOpacity,
      setCurrent: (next) => { this.currentHeaderOpacity = next; }
    });

  }

  bindPercentControl({ input, value, storageKey, getCurrent, setCurrent, apply = () => this.applyTransparency() }) {
    if (!input || !value) return;

    const sync = (next) => {
      input.value = String(next);
      value.textContent = `${next}%`;
    };

    sync(getCurrent());
    input.addEventListener('input', () => {
      const next = Number(input.value);
      setCurrent(next);
      localStorage.setItem(storageKey, String(next));
      sync(next);
      apply();
    });
  }

  bindCardControls() {
    const sizeInput = document.getElementById('card-size');
    const sizeValue = document.getElementById('card-size-value');
    const textGroup = document.getElementById('card-text-group');

    this.bindPercentControl({
      input: document.getElementById('card-background-strength'),
      value: document.getElementById('card-background-strength-value'),
      storageKey: this.cardBackgroundStrengthKey,
      getCurrent: () => this.currentCardBackgroundStrength,
      setCurrent: (next) => {
        this.currentCardBackgroundStrength = next;
      },
      apply: () => this.applyCardPreferences()
    });

    const syncSize = () => {
      if (!sizeInput || !sizeValue) return;
      sizeInput.value = String(this.currentCardSize);
      sizeValue.textContent = `${this.currentCardSize}px`;
    };

    sizeInput?.addEventListener('input', () => {
      this.setCardSize(Number(sizeInput.value));
    });

    textGroup?.addEventListener('click', (event) => {
      const button = event.target.closest('.menu-toggle-btn');
      if (!button) return;
      this.currentCardText = button.dataset.value;
      localStorage.setItem(this.cardTextKey, this.currentCardText);
      this.applyCardPreferences();
    });

    EventBus.on('settings:adjustCardSize', (direction) => {
      this.setCardSize(this.currentCardSize + direction * this.cardSizeStep);
      syncSize();
    });

    syncSize();
  }

  setCardSize(size) {
    this.currentCardSize = Math.min(this.cardSizeMax, Math.max(this.cardSizeMin, size));
    localStorage.setItem(this.cardSizeKey, String(this.currentCardSize));
    document.documentElement.style.setProperty('--card-size', `${this.currentCardSize}px`);
    const value = document.getElementById('card-size-value');
    if (value) value.textContent = `${this.currentCardSize}px`;
  }

  applyCardPreferences() {
    this.setCardSize(this.currentCardSize);
    document.documentElement.style.setProperty('--card-background-strength', `${this.currentCardBackgroundStrength}%`);

    const app = document.getElementById('app');
    if (app) app.dataset.showCardText = this.currentCardText;

    document.getElementById('card-text-on')?.classList.toggle('active', this.currentCardText === 'true');
    document.getElementById('card-text-off')?.classList.toggle('active', this.currentCardText !== 'true');
  }

  renderWallpapers() {
    this.wallpaperGrid.innerHTML = this.wallpapers.map(wp => `
      <button class="wallpaper-item ${wp.id === this.currentWallpaper ? 'active' : ''}"
           data-id="${wp.id}"
           type="button"
           title="${wp.name}">
        <span class="wallpaper-preview" style="${this.getPreviewStyle(wp)}"></span>
        <span class="wallpaper-name">${wp.name}</span>
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

  renderCustomControls() {
    const controls = document.createElement('div');
    controls.className = 'wallpaper-controls';
    controls.innerHTML = `
      <label class="wallpaper-upload">
        <input type="file" id="wallpaper-file" accept="image/*">
        <span>选择自定义图片</span>
      </label>
      <div class="wallpaper-status" role="status"></div>
      <div class="wallpaper-fit-group">
        ${this.fitModes.map(mode => `
          <button type="button" class="wallpaper-fit ${mode.id === this.currentFit ? 'active' : ''}" data-fit="${mode.id}">
            ${mode.name}
          </button>
        `).join('')}
      </div>
      <div class="menu-range-stack wallpaper-range-stack">
      <label class="menu-range-control">
        <span>壁纸亮度 <strong id="wallpaper-brightness-value">${100 - this.currentWallpaperOverlayOpacity}%</strong></span>
        <input type="range" id="wallpaper-brightness" min="0" max="100" step="1" value="${100 - this.currentWallpaperOverlayOpacity}">
        <span class="menu-range-scale"><small>更暗</small><small>更亮</small></span>
      </label>
      <label class="menu-range-control">
        <span>壁纸模糊 <strong id="wallpaper-blur-value">${this.currentBlur}px</strong></span>
        <input type="range" id="wallpaper-blur" min="0" max="32" step="1" value="${this.currentBlur}">
        <span class="menu-range-scale"><small>清晰</small><small>柔和</small></span>
      </label>
      </div>
    `;
    this.wallpaperGrid.insertAdjacentElement('afterend', controls);

    controls.querySelector('#wallpaper-file').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.setCustomImage(file);
      e.target.value = '';
    });
    controls.querySelectorAll('.wallpaper-fit').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFit = btn.dataset.fit;
        localStorage.setItem(this.fitKey, this.currentFit);
        controls.querySelectorAll('.wallpaper-fit').forEach(item => item.classList.toggle('active', item === btn));
        this.applyWallpaper(this.currentWallpaper);
      });
    });
    controls.querySelector('#wallpaper-blur').addEventListener('input', (e) => {
      this.currentBlur = Number(e.target.value);
      localStorage.setItem(this.blurKey, String(this.currentBlur));
      controls.querySelector('#wallpaper-blur-value').textContent = `${this.currentBlur}px`;
      this.applyWallpaper(this.currentWallpaper);
    });
    controls.querySelector('#wallpaper-brightness').addEventListener('input', (e) => {
      const brightness = Number(e.target.value);
      this.currentWallpaperOverlayOpacity = 100 - brightness;
      localStorage.setItem(this.wallpaperOverlayOpacityKey, String(this.currentWallpaperOverlayOpacity));
      controls.querySelector('#wallpaper-brightness-value').textContent = `${brightness}%`;
      this.applyTransparency();
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

    wallpaper.style.setProperty('--wallpaper-blur', `${this.currentBlur}px`);
    wallpaper.style.background = '';
    wallpaper.style.backgroundImage = '';
    wallpaper.style.backgroundSize = '';
    wallpaper.style.backgroundPosition = '';
    wallpaper.style.backgroundRepeat = '';

    if (wp.type === 'color') {
      wallpaper.style.background = wp.value;
      return;
    }

    if (wp.type === 'image') {
      wallpaper.style.backgroundImage = `url("${wp.value}")`;
      this.applyFit(wallpaper, this.currentFit);
      return;
    }

    if (wp.type === 'custom') {
      const image = localStorage.getItem(this.customImageKey);
      if (!image) {
        wallpaper.style.background = this.wallpapers[0].value;
        return;
      }
      wallpaper.style.backgroundImage = `url(${image})`;
      this.applyFit(wallpaper, this.currentFit);
    }
  }

  async setCustomImage(file) {
    try {
      this.showStatus('正在压缩壁纸...');
      const result = await this.compressImageFile(file);
      localStorage.setItem(this.customImageKey, result.dataUrl);
      this.setWallpaper('custom');
      this.renderWallpapers();
      this.showStatus(`已压缩到 ${this.formatBytes(result.bytes)}，尺寸 ${result.width}×${result.height}。`);
    } catch (err) {
      const message = err?.name === 'QuotaExceededError'
        ? '本地存储空间不足，已压缩后仍无法保存'
        : (err.message || err);
      this.showStatus(`壁纸不可用：${message}`, true);
    }
  }

  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片读取失败'));
      };
      image.src = url;
    });
  }

  async compressImageFile(file) {
    if (!file.type.startsWith('image/')) {
      throw new Error('请选择图片文件');
    }

    const image = await this.loadImageFromFile(file);
    const attempts = [
      { max: 1920, quality: 0.86 },
      { max: 1600, quality: 0.82 },
      { max: 1400, quality: 0.78 },
      { max: 1200, quality: 0.74 },
      { max: 1000, quality: 0.7 },
      { max: 800, quality: 0.66 }
    ];

    for (const attempt of attempts) {
      const dataUrl = this.renderImageToDataUrl(image, attempt.max, attempt.quality);
      if (dataUrl.length <= this.maxCustomImageChars) {
        return {
          dataUrl,
          bytes: this.estimateDataUrlBytes(dataUrl),
          ...this.getScaledSize(image, attempt.max)
        };
      }
    }

    throw new Error('图片过大，已尝试压缩但仍超过本地存储上限');
  }

  renderImageToDataUrl(image, maxSize, quality) {
    const { width, height } = this.getScaledSize(image, maxSize);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/webp', quality);
  }

  getScaledSize(image, maxSize) {
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    return {
      width: Math.max(1, Math.round(image.naturalWidth * scale)),
      height: Math.max(1, Math.round(image.naturalHeight * scale))
    };
  }

  estimateDataUrlBytes(dataUrl) {
    const payload = dataUrl.split(',')[1] || '';
    return Math.round(payload.length * 0.75);
  }

  formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  showStatus(message, isError = false) {
    const status = document.querySelector('.wallpaper-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  applyFit(wallpaper, fit) {
    const map = {
      cover: ['cover', 'center', 'no-repeat'],
      contain: ['contain', 'center', 'no-repeat'],
      fill: ['100% 100%', 'center', 'no-repeat'],
      center: ['auto', 'center', 'no-repeat'],
      tile: ['auto', 'top left', 'repeat']
    };
    const [size, position, repeat] = map[fit] || map.cover;
    wallpaper.style.backgroundSize = size;
    wallpaper.style.backgroundPosition = position;
    wallpaper.style.backgroundRepeat = repeat;
  }

  getPreviewStyle(wp) {
    if (wp.type === 'color') {
      return `background:${wp.value};`;
    }

    if (wp.type === 'image') {
      return `background-image:url('${wp.preview || wp.value}');background-size:cover;background-position:center;`;
    }

    const image = localStorage.getItem(this.customImageKey);
    return image
      ? `background-image:url(${image});background-size:cover;background-position:center;`
      : 'background:#f4f3ee;';
  }
}

export default SettingsPanel;
