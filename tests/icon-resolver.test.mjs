import assert from 'node:assert/strict';
import test from 'node:test';

import { ICON_MATCHER_VERSION } from '../core/icons/IconLibraryProvider.js';
import { getInitialFallback, resolveBookmarkIcon } from '../core/icons/IconResolver.js';

function createStorage({ custom = null, resolved = null } = {}) {
  return {
    getCustomIcon() {
      return custom;
    },
    getResolvedIcon() {
      return resolved;
    },
    setResolvedIcon(_id, model) {
      resolved = model;
    }
  };
}

test('resolveBookmarkIcon returns user custom SVG first', () => {
  const model = resolveBookmarkIcon(
    { id: '1', title: 'GitHub', url: 'https://github.com' },
    {
      storage: createStorage({ custom: '<svg viewBox="0 0 1 1"></svg>' }),
      findLibraryIcon() {
        throw new Error('library should not be called when custom icon exists');
      }
    }
  );

  assert.equal(model.type, 'svg');
  assert.equal(model.source, 'custom');
  assert.equal(model.matchReason, 'user-selected');
});

test('resolveBookmarkIcon returns user custom bitmap first', () => {
  const model = resolveBookmarkIcon(
    { id: '1', title: 'GitHub', url: 'https://github.com' },
    {
      storage: createStorage({ custom: 'data:image/png;base64,abc' })
    }
  );

  assert.equal(model.type, 'image');
  assert.equal(model.source, 'custom');
});

test('resolveBookmarkIcon returns cached resolved library icon before searching', () => {
  const cached = {
    type: 'svg',
    value: '<svg viewBox="0 0 24 24"></svg>',
    source: 'simple-icons',
    sourceLabel: 'Simple Icons',
    matchReason: 'domain:github.com',
    matcherVersion: ICON_MATCHER_VERSION
  };
  const model = resolveBookmarkIcon(
    { id: '1', title: 'GitHub', url: 'https://github.com' },
    {
      storage: createStorage({ resolved: cached }),
      findLibraryIcon() {
        throw new Error('library should not be called when resolved cache exists');
      }
    }
  );

  assert.deepEqual(model, cached);
});

test('resolveBookmarkIcon ignores stale resolved cache after matcher changes', () => {
  let cached = {
    type: 'initial',
    value: '数',
    source: 'fallback',
    sourceLabel: 'Initial fallback',
    matchReason: 'no-library-match'
  };
  const storage = {
    getCustomIcon: () => null,
    getResolvedIcon: () => cached,
    setResolvedIcon: (_id, model) => {
      cached = model;
    }
  };

  const model = resolveBookmarkIcon(
    { id: '1', title: '数据库备份', url: 'http://192.168.31.12/' },
    {
      storage,
      findLibraryIcon() {
        return {
          title: 'Database',
          type: 'svg',
          svg: '<svg viewBox="0 0 24 24"></svg>',
          source: 'generic-icons',
          sourceLabel: 'Lucide Icons',
          matchReason: 'generic:title:数据库'
        };
      }
    }
  );

  assert.equal(model.source, 'generic-icons');
  assert.equal(model.matchReason, 'generic:title:数据库');
  assert.equal(cached, model);
  assert.equal(cached.matcherVersion, ICON_MATCHER_VERSION);
});

test('resolveBookmarkIcon returns and caches fresh library match', () => {
  let cached = null;
  const storage = {
    getCustomIcon: () => null,
    getResolvedIcon: () => cached,
    setResolvedIcon: (_id, model) => {
      cached = model;
    }
  };

  const model = resolveBookmarkIcon(
    { id: '1', title: 'GitHub', url: 'https://github.com' },
    {
      storage,
      findLibraryIcon() {
        return {
          title: 'GitHub',
          type: 'svg',
          svg: '<svg viewBox="0 0 24 24"></svg>',
          source: 'simple-icons',
          sourceLabel: 'Simple Icons',
          matchReason: 'domain:github.com'
        };
      }
    }
  );

  assert.equal(model.type, 'svg');
  assert.equal(model.source, 'simple-icons');
  assert.equal(cached, model);
});

test('resolveBookmarkIcon returns initial fallback without favicon dependency', () => {
  let faviconCalled = false;
  const model = resolveBookmarkIcon(
    { id: '1', title: 'Internal Tool', url: 'http://192.168.31.12' },
    {
      storage: createStorage(),
      findLibraryIcon: () => null,
      fetchFavicon: () => {
        faviconCalled = true;
      }
    }
  );

  assert.equal(model.type, 'initial');
  assert.equal(model.value, 'I');
  assert.equal(model.source, 'fallback');
  assert.equal(model.matchReason, 'no-library-match');
  assert.equal(faviconCalled, false);
});

test('getInitialFallback uses hostname when title is empty', () => {
  assert.deepEqual(getInitialFallback({ title: '', url: 'https://github.com/repo' }), {
    type: 'initial',
    value: 'G',
    source: 'fallback',
    sourceLabel: 'Initial fallback',
    matchReason: 'no-library-match'
  });
});
