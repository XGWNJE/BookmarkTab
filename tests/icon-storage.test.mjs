import assert from 'node:assert/strict';
import test from 'node:test';

import { createIconStorage } from '../core/icons/IconStorage.js';

function createMemoryArea(seed = {}) {
  const data = { ...seed };
  return {
    data,
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    }
  };
}

test('custom and resolved icons use separate storage keys', () => {
  const localStorage = createMemoryArea();
  const storage = createIconStorage({ localStorage });

  storage.setCustomIcon('1', '<svg><path d="M1 1"/></svg>');
  storage.setResolvedIcon('1', { type: 'svg', value: '<svg><path d="M2 2"/></svg>', source: 'simple-icons' });

  assert.equal(storage.getCustomIcon('1'), '<svg><path d="M1 1"/></svg>');
  assert.deepEqual(storage.getResolvedIcon('1'), {
    type: 'svg',
    value: '<svg><path d="M2 2"/></svg>',
    source: 'simple-icons'
  });
  assert.notEqual(localStorage.getItem('custom_icon_cache'), localStorage.getItem('resolved_icon_cache_v1'));
});

test('clearing resolved icon does not remove custom icon', () => {
  const storage = createIconStorage({ localStorage: createMemoryArea() });

  storage.setCustomIcon('bookmark-id', 'data:image/png;base64,custom');
  storage.setResolvedIcon('bookmark-id', { type: 'svg', value: '<svg></svg>', source: 'simple-icons' });
  storage.clearResolvedIcon('bookmark-id');

  assert.equal(storage.getCustomIcon('bookmark-id'), 'data:image/png;base64,custom');
  assert.equal(storage.getResolvedIcon('bookmark-id'), null);
});

test('storage recovers from invalid stored JSON', () => {
  const localStorage = createMemoryArea({
    custom_icon_cache: '{bad',
    resolved_icon_cache_v1: '{bad'
  });
  const storage = createIconStorage({ localStorage });

  assert.equal(storage.getCustomIcon('1'), null);
  assert.equal(storage.getResolvedIcon('1'), null);
  assert.equal(localStorage.getItem('custom_icon_cache'), null);
  assert.equal(localStorage.getItem('resolved_icon_cache_v1'), null);
});
