import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBitmapDimensions } from '../core/icons/BitmapIconProcessor.js';

test('validateBitmapDimensions rejects images narrower than 256', () => {
  assert.deepEqual(validateBitmapDimensions(255, 256), {
    ok: false,
    reason: '图标尺寸太小（255×256），请使用至少 256×256 的高清图标'
  });
});

test('validateBitmapDimensions rejects images shorter than 256', () => {
  assert.deepEqual(validateBitmapDimensions(256, 255), {
    ok: false,
    reason: '图标尺寸太小（256×255），请使用至少 256×256 的高清图标'
  });
});

test('validateBitmapDimensions accepts exactly 256 square image', () => {
  assert.deepEqual(validateBitmapDimensions(256, 256), { ok: true });
});

test('validateBitmapDimensions accepts larger image', () => {
  assert.deepEqual(validateBitmapDimensions(512, 384), { ok: true });
});
