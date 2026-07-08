import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

class FakeElement {
  constructor(id) {
    this.id = id;
    this.listeners = new Map();
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  click() {
    for (const callback of this.listeners.get('click') || []) {
      callback({ target: this });
    }
  }
}

function installBrowserStubs(elementIds) {
  const elements = new Map(elementIds.map(id => [id, new FakeElement(id)]));

  globalThis.document = {
    getElementById(id) {
      return elements.get(id) || null;
    }
  };

  globalThis.location = { href: 'chrome-extension://markpad/index.html' };
  globalThis.history = {
    replaceState() {},
    pushState() {},
    back() {}
  };
  globalThis.window = {
    addEventListener() {}
  };

  return elements;
}

test('toolbar uses menu action items for creation and icon search trigger', async () => {
  const elements = installBrowserStubs([
    'toolbar',
    'btn-search',
    'menu-new-bookmark',
    'menu-new-folder'
  ]);

  const EventBus = (await import('../core/EventBus.js')).default;
  const Toolbar = (await import('../components/Toolbar.js')).default;
  const emitted = [];

  EventBus.on('toolbar:newBookmark', () => emitted.push('toolbar:newBookmark'));
  EventBus.on('toolbar:newFolder', () => emitted.push('toolbar:newFolder'));
  EventBus.on('toolbar:search', () => emitted.push('toolbar:search'));

  new Toolbar();
  elements.get('menu-new-bookmark').click();
  elements.get('menu-new-folder').click();
  elements.get('btn-search').click();

  assert.deepEqual(emitted, [
    'toolbar:newBookmark',
    'toolbar:newFolder',
    'toolbar:search'
  ]);
});

test('header keeps creation actions inside the settings menu', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const headerHtml = html.match(/<header[\s\S]*?<\/header>/)?.[0] || '';
  const menuHtml = html.match(/<div id="menu-panel"[\s\S]*?<!-- 快速查找弹窗 -->/)?.[0] || '';
  const breadcrumbCss = await readFile(new URL('../css/modules/breadcrumb.css', import.meta.url), 'utf8');
  const iconLibrary = await readFile(new URL('../core/IconLibrary.js', import.meta.url), 'utf8');
  const gridCss = await readFile(new URL('../css/modules/grid.css', import.meta.url), 'utf8');
  const toolbarCss = await readFile(new URL('../css/modules/toolbar.css', import.meta.url), 'utf8');
  const wallpapersCss = await readFile(new URL('../css/modules/wallpapers.css', import.meta.url), 'utf8');
  const settingsPanel = await readFile(new URL('../components/SettingsPanel.js', import.meta.url), 'utf8');

  assert.doesNotMatch(headerHtml, /id="btn-new-bookmark"|id="btn-new-folder"/);
  assert.match(headerHtml, /id="btn-search"[^>]*class="[^"]*toolbar-icon-btn/);
  assert.match(headerHtml, /id="menu-trigger"[^>]*class="[^"]*toolbar-icon-btn/);
  assert.match(headerHtml, /id="menu-trigger"[\s\S]*data-icon="settings"/);
  assert.doesNotMatch(headerHtml, /<span class="toolbar-label">/);

  assert.match(menuHtml, /<div class="menu-panel-title">设置<\/div>/);
  assert.match(menuHtml, /<div class="menu-section-label">常用操作<\/div>/);
  assert.match(menuHtml, /id="menu-new-bookmark"/);
  assert.match(menuHtml, /id="menu-new-folder"/);

  assert.match(breadcrumbCss, /\.breadcrumb\s*\{[\s\S]*?flex:\s*0 1 auto;/);
  assert.match(breadcrumbCss, /\.breadcrumb\s*\{[\s\S]*?width:\s*fit-content;/);
  assert.match(breadcrumbCss, /\.breadcrumb\s*\{[\s\S]*?background:\s*transparent;/);
  assert.match(breadcrumbCss, /\.breadcrumb-item\.active\s*\{[\s\S]*?background:\s*transparent;/);

  assert.match(iconLibrary, /Lucide/);
  assert.match(iconLibrary, /search:\s*\[[\s\S]*?<path d="m21 21-4\.34-4\.34"\/>/);
  assert.match(iconLibrary, /settings:\s*\[[\s\S]*?<path d="M9\.671 4\.136/);

  assert.doesNotMatch(gridCss, /mask-image:\s*linear-gradient/);
  assert.doesNotMatch(gridCss, /-webkit-mask-image:\s*linear-gradient/);
  assert.doesNotMatch(gridCss.match(/\.content\s*\{[\s\S]*?\}/)?.[0] || '', /padding-top/);
  assert.doesNotMatch(gridCss.match(/@media \(max-width: 768px\)\s*\{[\s\S]*?\.content\s*\{[\s\S]*?\}/)?.[0] || '', /padding-top/);
  assert.match(gridCss, /\.grid-scroll-inner\s*\{[\s\S]*?padding:\s*calc\(64px \+ var\(--space-6\)\) 0 var\(--space-24\);/);
  assert.match(gridCss, /@media \(max-width: 768px\)\s*\{[\s\S]*?\.grid-scroll-inner\s*\{[\s\S]*?padding-top:\s*calc\(60px \+ var\(--space-4\)\);/);

  assert.match(menuHtml, /id="header-opacity"/);
  assert.match(menuHtml, /id="wallpaper-overlay-opacity"/);
  assert.match(toolbarCss, /--toolbar-alpha/);
  assert.match(wallpapersCss, /--wallpaper-overlay-alpha/);
  assert.match(settingsPanel, /headerOpacityKey/);
  assert.match(settingsPanel, /wallpaperOverlayOpacityKey/);
  assert.match(settingsPanel, /--toolbar-opacity/);
  assert.match(settingsPanel, /--wallpaper-overlay-opacity/);
});
