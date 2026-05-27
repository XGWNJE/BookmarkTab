class IconSourceProvider {
  constructor() {
    this.iconfontSearchUrl = 'https://www.iconfont.cn/api/search/icon.json';
    this.iconifySearchUrl = 'https://api.iconify.design/search';
    this.iconifySvgUrl = 'https://api.iconify.design';
    this.svgApiSearchUrl = 'https://api.svgapi.com/v1/Ty5WcDa63E/list/';
    this.managedIconfontTabId = null;
  }

  async search(query, options = {}) {
    const limit = options.limit || 24;
    const trimmed = query?.trim();
    if (!trimmed) return { icons: [], sources: [], notices: [] };
    const iconfontOnly = options.source === 'iconfont';

    const settled = await Promise.allSettled([
      this.searchIconfont(trimmed, limit),
      iconfontOnly ? Promise.resolve({ icons: [] }) : this.searchIconify(trimmed, limit),
      iconfontOnly ? Promise.resolve({ icons: [] }) : this.searchSvgApi(trimmed, limit)
    ]);

    const iconfont = this.readSettled(settled[0]);
    const iconify = this.readSettled(settled[1]);
    const svgapi = this.readSettled(settled[2]);
    const icons = iconfontOnly
      ? iconfont.icons
      : this.selectByQuota({ iconfont: iconfont.icons, iconify: iconify.icons, svgapi: svgapi.icons }, limit);
    const notices = [
      ...iconfont.notices,
      ...iconify.notices,
      ...svgapi.notices
    ];

    if (!iconfont.icons.length) {
      notices.push(iconfont.message || (iconfontOnly ? 'iconfont 当前未返回可用 SVG。' : 'iconfont 当前未返回可用 SVG，已按比例混入 Iconify 与 SVG API 候选。'));
    }
    if (!iconify.icons.length && iconify.message) {
      notices.push(`Iconify 暂无可用结果：${iconify.message}`);
    }
    if (!svgapi.icons.length && svgapi.message) {
      notices.push(`SVG API 暂无可用结果：${svgapi.message}`);
    }

    return {
      icons,
      sources: ['iconfont', 'iconify', 'svgapi'].filter((_, index) => [iconfont, iconify, svgapi][index].icons.length),
      notices
    };
  }

  readSettled(result) {
    if (result.status === 'fulfilled') {
      return {
        icons: result.value.icons || [],
        notices: result.value.notice ? [result.value.notice] : [],
        message: result.value.message || ''
      };
    }

    return {
      icons: [],
      notices: [],
      message: result.reason?.message || '图标源请求失败'
    };
  }

  selectByQuota(sourceMap, limit) {
    const hasIconfont = sourceMap.iconfont.length > 0;
    const quotas = hasIconfont
      ? { iconfont: 0.5, iconify: 0.3, svgapi: 0.2 }
      : { iconfont: 0, iconify: 0.6, svgapi: 0.4 };
    const picked = [];
    const seen = new Set();

    Object.entries(quotas).forEach(([source, ratio]) => {
      const count = Math.floor(limit * ratio);
      this.pushUnique(picked, seen, sourceMap[source], count);
    });

    return this.mixSources(Object.values(sourceMap), limit, picked, seen);
  }

  pushUnique(target, seen, icons, count) {
    let pushed = 0;
    for (const icon of icons) {
      if (pushed >= count) break;
      if (seen.has(icon.id)) continue;
      target.push(icon);
      seen.add(icon.id);
      pushed += 1;
    }
  }

  mixSources(sourceLists, limit, mixed = [], seen = new Set()) {
    const maxLength = Math.max(...sourceLists.map(list => list.length));

    for (let i = 0; i < maxLength && mixed.length < limit; i += 1) {
      for (const list of sourceLists) {
        const icon = list[i];
        if (!icon || seen.has(icon.id)) continue;
        mixed.push(icon);
        seen.add(icon.id);
        if (mixed.length >= limit) break;
      }
    }

    return mixed;
  }

  async searchIconfont(query, limit) {
    const url = `${this.iconfontSearchUrl}?q=${encodeURIComponent(query)}&page=1&pageSize=${limit}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json,text/plain,*/*'
      }
    });

    const text = await response.text();
    const data = this.parseJson(text);
    if (!data) {
      return await this.searchIconfontInLoggedTab(query, limit, 'iconfont 返回网页内容，未返回 JSON 搜索结果。');
    }

    if (data.error_code === 'LOGIN REQUIRED' || data.message === 'LOGIN REQUIRED') {
      const tabResult = await this.searchIconfontInLoggedTab(query, limit);
      if (tabResult.icons.length || tabResult.message) return tabResult;
      return this.iconfontLoginRequired();
    }

    const rows = this.findIconfontRows(data).slice(0, limit);
    const icons = rows.map(row => this.mapIconfontRow(row)).filter(Boolean);
    if (!icons.length) {
      return await this.searchIconfontInLoggedTab(query, limit, 'iconfont API 返回数据但没有直接 SVG 字段。');
    }
    return { icons };
  }

  async searchIconfontInLoggedTab(query, limit) {
    if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) {
      return { icons: [], message: '' };
    }

    const tab = await this.ensureIconfontSearchTab(query);
    if (!tab) {
      return {
        icons: [],
        message: 'iconfont 搜索页准备失败。请确认 Chrome 允许扩展打开 iconfont.cn。'
      };
    }

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async ({ q, pageSize }) => {
          const response = await fetch(`/api/search/icon.json?q=${encodeURIComponent(q)}&page=1&pageSize=${pageSize}`, {
            credentials: 'include',
            headers: {
              Accept: 'application/json,text/plain,*/*'
            }
          });
          const text = await response.text();
          return {
            ok: response.ok,
            status: response.status,
            text: text.slice(0, 200000)
          };
        },
        args: [{ q: query, pageSize: limit }]
      });

      const payload = result?.result;
      const data = this.parseJson(payload?.text || '');
      if (!data) {
        return await this.scrapeIconfontPage(tab.id, limit, '已在 iconfont 标签页执行请求，但返回内容不是 JSON，改从当前页面抽取可见 SVG。');
      }
      if (data.error_code === 'LOGIN REQUIRED' || data.message === 'LOGIN REQUIRED') {
        return await this.scrapeIconfontPage(tab.id, limit, 'iconfont API 仍返回 LOGIN REQUIRED，已尝试从当前搜索页抽取可见 SVG。');
      }

      const rows = this.findIconfontRows(data).slice(0, limit);
      const icons = rows.map(row => this.mapIconfontRow(row)).filter(Boolean);
      if (!icons.length) {
        return await this.scrapeIconfontPage(tab.id, limit, 'iconfont API 已返回数据，但未找到 SVG 字段，已尝试从页面抽取可见 SVG。');
      }
      return {
        icons,
        message: ''
      };
    } catch (err) {
      return {
        icons: [],
        message: `iconfont 登录态桥接失败：${err?.message || err}`
      };
    }
  }

  pickIconfontTab(tabs, query) {
    const normalizedQuery = query.trim().toLowerCase();
    const searchTabs = tabs.filter(item => item.id && item.url?.includes('/search/index'));
    return searchTabs.find(item => {
      try {
        const url = new URL(item.url);
        return decodeURIComponent(url.searchParams.get('q') || '').trim().toLowerCase() === normalizedQuery;
      } catch {
        return false;
      }
    }) || null;
  }

  async ensureIconfontSearchTab(query) {
    const url = this.buildIconfontSearchPageUrl(query);
    const tabs = await chrome.tabs.query({ url: 'https://www.iconfont.cn/*' });
    const matching = this.pickIconfontTab(tabs, query);
    if (matching) {
      await this.waitForIconfontSearchReady(matching.id);
      return matching;
    }

    let tab = null;
    if (this.managedIconfontTabId) {
      try {
        tab = await chrome.tabs.get(this.managedIconfontTabId);
      } catch {
        this.managedIconfontTabId = null;
      }
    }

    if (tab?.id) {
      tab = await chrome.tabs.update(tab.id, { url, active: false });
    } else {
      tab = await chrome.tabs.create({ url, active: false });
      this.managedIconfontTabId = tab.id;
    }

    await this.waitForIconfontSearchReady(tab.id);
    return await chrome.tabs.get(tab.id);
  }

  async closeManagedIconfontTab() {
    if (!this.managedIconfontTabId || !globalThis.chrome?.tabs) return;
    const tabId = this.managedIconfontTabId;
    this.managedIconfontTabId = null;
    try {
      await chrome.tabs.remove(tabId);
    } catch {
      // The user may have closed it already.
    }
  }

  buildIconfontSearchPageUrl(query) {
    return `https://www.iconfont.cn/search/index?searchType=icon&q=${encodeURIComponent(query)}`;
  }

  async waitForIconfontSearchReady(tabId) {
    for (let i = 0; i < 24; i += 1) {
      await this.sleep(250);
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.status !== 'complete') continue;
        const [result] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => ({
            readyState: document.readyState,
            resultCount: document.querySelectorAll('.block-icon-list li').length,
            svgCount: document.querySelectorAll('.block-icon-list li svg').length
          })
        });
        const value = result?.result;
        if (value?.readyState === 'complete' && (value.resultCount > 0 || value.svgCount > 0)) return;
      } catch {
        // The page may still be navigating.
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeIconfontPage(tabId, limit, notice) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: async ({ pageSize }) => {
          const isVisible = (el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return rect.width >= 12 && rect.height >= 12 && style.visibility !== 'hidden' && style.display !== 'none';
          };

          const nearestText = (el) => {
            const host = el.closest('li, .icon-item, .block-icon-list-item, .icon-gouwuche1, .dib, [class*="icon"]') || el.parentElement;
            const text = host?.innerText?.replace(/\s+/g, ' ').trim() || '';
            return text.split(' ').filter(Boolean).slice(0, 3).join(' ') || 'iconfont';
          };

          const expandUseReferences = (svg) => {
            svg.querySelectorAll('use').forEach((use) => {
              const href = use.getAttribute('href') || use.getAttribute('xlink:href');
              if (!href || !href.startsWith('#')) return;
              const symbol = document.getElementById(href.slice(1));
              if (!symbol) return;
              if (!svg.getAttribute('viewBox') && symbol.getAttribute('viewBox')) {
                svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
              }
              const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              [...symbol.childNodes].forEach(node => group.appendChild(node.cloneNode(true)));
              use.replaceWith(group);
            });
          };

          const icons = [];
          const seen = new Set();

          const pushSvg = ({ raw, name, sourceUrl, index }) => {
            if (icons.length >= pageSize || !raw || !raw.trim().startsWith('<svg')) return;
            const normalizedRaw = raw.trim();
            const signature = normalizedRaw.replace(/\s+/g, '');
            if (seen.has(signature)) return;
            seen.add(signature);
            icons.push({
              id: `iconfont:dom:${index}`,
              name,
              source: 'iconfont',
              sourceLabel: 'iconfont 页面',
              sourceUrl: sourceUrl || location.href,
              license: '以 iconfont 页面标注为准',
              svg: normalizedRaw
            });
          };

          document.querySelectorAll('.block-icon-list li').forEach((item, index) => {
            const svg = item.querySelector('svg.icon, svg');
            if (!svg) return;
            const clone = svg.cloneNode(true);
            clone.removeAttribute('style');
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            expandUseReferences(clone);
            if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', '0 0 1024 1024');
            if (!clone.querySelector('path, circle, rect, polygon, polyline, line, ellipse, g')) return;
            const name = item.querySelector('.icon-name')?.textContent?.replace(/\s+/g, ' ').trim() || nearestText(item);
            pushSvg({
              raw: clone.outerHTML,
              name,
              sourceUrl: location.href,
              index: `result:${index}`
            });
          });

          document.querySelectorAll('svg').forEach((svg, index) => {
            if (!isVisible(svg)) return;
            const clone = svg.cloneNode(true);
            clone.removeAttribute('style');
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            expandUseReferences(clone);
            if (!clone.getAttribute('viewBox')) {
              const rect = svg.getBoundingClientRect();
              clone.setAttribute('viewBox', `0 0 ${Math.ceil(rect.width)} ${Math.ceil(rect.height)}`);
            }
            if (!clone.querySelector('path, circle, rect, polygon, polyline, line, ellipse, g')) return;
            pushSvg({
              raw: clone.outerHTML,
              name: nearestText(svg),
              sourceUrl: location.href,
              index
            });
          });

          const svgUrlPattern = /url\(["']?([^"')]+\.svg[^"')]*?)["']?\)/i;
          const svgImageUrls = [];
          document.querySelectorAll('img, object, embed').forEach((el) => {
            const src = el.getAttribute('src') || el.getAttribute('data') || '';
            if (/\.svg(\?|#|$)/i.test(src) && isVisible(el)) svgImageUrls.push({ url: src, el });
          });
          document.querySelectorAll('*').forEach((el) => {
            if (!isVisible(el)) return;
            const bg = getComputedStyle(el).backgroundImage || '';
            const match = bg.match(svgUrlPattern);
            if (match) svgImageUrls.push({ url: match[1], el });
          });

          for (let i = 0; i < svgImageUrls.length && icons.length < pageSize; i += 1) {
            try {
              const item = svgImageUrls[i];
              const url = new URL(item.url, location.href).href;
              const response = await fetch(url, { credentials: 'include' });
              if (!response.ok) continue;
              const raw = await response.text();
              pushSvg({
                raw,
                name: nearestText(item.el),
                sourceUrl: url,
                index: `img:${i}`
              });
            } catch {
              // Ignore individual image extraction failures.
            }
          }

          return {
            href: location.href,
            resultItems: document.querySelectorAll('.block-icon-list li').length,
            totalSvg: document.querySelectorAll('svg').length,
            totalSvgImages: svgImageUrls.length,
            icons
          };
        },
        args: [{ pageSize: limit }]
      });

      const icons = result?.result?.icons || [];
      const resultItems = result?.result?.resultItems || 0;
      const totalSvg = result?.result?.totalSvg || 0;
      const totalSvgImages = result?.result?.totalSvgImages || 0;
      return {
        icons,
        message: icons.length
          ? `${notice} 已从 iconfont 当前页面抽取 ${icons.length} 个 SVG。`
          : `${notice} 当前页面检测到 ${resultItems} 个结果项、${totalSvg} 个内联 SVG、${totalSvgImages} 个 SVG 图片引用，但没有可用图标 SVG。请把 iconfont 搜索结果页保持在前台后重试。`
      };
    } catch (err) {
      return {
        icons: [],
        message: `iconfont 页面抽取失败：${err?.message || err}`
      };
    }
  }

  iconfontLoginRequired() {
    return {
      icons: [],
      message: 'iconfont 仍返回 LOGIN REQUIRED。请确认已登录 iconfont.cn，并保持该标签页打开后重试。'
    };
  }

  parseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  findIconfontRows(data) {
    const candidates = [
      data?.data?.icons,
      data?.data?.list,
      data?.data?.items,
      data?.data,
      data?.icons,
      data?.list,
      data?.items
    ];

    return candidates.find(Array.isArray) || [];
  }

  mapIconfontRow(row) {
    const svg = row.svg || row.show_svg || row.content || row.path;
    if (!svg || !String(svg).trimStart().startsWith('<')) return null;
    const id = row.id || row.icon_id || row.iconId || row.glyph_id || row.name;
    return {
      id: `iconfont:${id}`,
      name: row.name || row.name_cn || row.font_class || `iconfont-${id}`,
      source: 'iconfont',
      sourceLabel: 'iconfont',
      sourceUrl: row.url || row.detail_url || 'https://www.iconfont.cn/',
      license: '以 iconfont 页面标注为准',
      svg
    };
  }

  async searchIconify(query, limit) {
    const url = `${this.iconifySearchUrl}?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Icon search failed: ${response.status}`);
    }

    const data = await response.json();
    const iconIds = Array.isArray(data.icons) ? data.icons.slice(0, limit) : [];

    const settled = await Promise.allSettled(iconIds.map(async (iconId) => {
      const svg = await this.getIconifySvg(iconId);
      const collection = iconId.split(':')[0];
      const collectionInfo = data.collections?.[collection];
      return {
        id: `iconify:${iconId}`,
        name: iconId,
        source: 'iconify',
        sourceLabel: `Iconify · ${collectionInfo?.name || collection}`,
        sourceUrl: `https://icon-sets.iconify.design/${iconId.replace(':', '/')}/`,
        license: collectionInfo?.license?.spdx || collectionInfo?.license?.title || 'unknown',
        svg
      };
    }));

    return {
      icons: settled
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(icon => icon.svg)
    };
  }

  async getIconifySvg(iconId) {
    const [prefix, name] = iconId.split(':');
    if (!prefix || !name) return null;
    const url = `${this.iconifySvgUrl}/${prefix}/${name}.svg?height=128`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  }

  async searchSvgApi(query, limit) {
    const url = `${this.svgApiSearchUrl}?search=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SVG API search failed: ${response.status}`);
    }

    const data = await response.json();
    const rows = Array.isArray(data.icons) ? data.icons.slice(0, limit) : [];
    const settled = await Promise.allSettled(rows.map(async (row) => {
      const svg = await this.fetchText(row.url);
      return {
        id: `svgapi:${row.id}`,
        name: row.title || row.slug || `svgapi-${row.id}`,
        source: 'svgapi',
        sourceLabel: 'SVG API',
        sourceUrl: row.url,
        license: 'source dependent',
        svg
      };
    }));

    return {
      icons: settled
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(icon => icon.svg)
    };
  }

  async fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  }
}

export default new IconSourceProvider();
