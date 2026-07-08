import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('BookmarkCard uses IconResolver and shared IconSanitizer', async () => {
  const source = await read('components/BookmarkCard.js');

  assert.match(source, /from '\.\.\/core\/icons\/IconResolver\.js'/);
  assert.match(source, /from '\.\.\/core\/icons\/IconSanitizer\.js'/);
  assert.doesNotMatch(source, /const isSvgRaw =/);
  assert.doesNotMatch(source, /\n\s*sanitizeSvg\(raw\)\s*\{/);
});

test('BookmarkCard refreshes default icon without deleting user custom icon', async () => {
  const source = await read('components/BookmarkCard.js');
  const refreshMethod = source.match(/async refreshDefaultIcon\(\) \{[\s\S]*?\n  \}/)?.[0] || '';

  assert.match(refreshMethod, /clearResolvedIcon\(this\.data\.id\)/);
  assert.doesNotMatch(refreshMethod, /removeCustomIcon\(this\.data\.id\)/);
});

test('BookmarkGrid does not schedule default favicon fetching after folder load', async () => {
  const source = await read('components/BookmarkGrid.js');
  const loadFolderBlock = source.match(/async loadFolder\(folderId\) \{[\s\S]*?\n  scheduleFaviconRefresh\(\)/)?.[0] || '';

  assert.doesNotMatch(loadFolderBlock, /scheduleFaviconRefresh\(\);/);
});

test('IconStudio uses shared sanitizer for manual SVG search', async () => {
  const source = await read('components/IconStudio.js');

  assert.match(source, /from '\.\.\/core\/icons\/IconSanitizer\.js'/);
  assert.doesNotMatch(source, /\n\s*sanitizeSvg\(raw\)\s*\{/);
});

test('IconStudio exposes a local library candidate mode with match context', async () => {
  const source = await read('components/IconStudio.js');

  assert.match(source, /getLibraryIconCandidates/);
  assert.match(source, /iconStudio:openLocal/);
  assert.match(source, /renderLocalContext/);
  assert.match(source, /应用本地图标/);
  assert.match(source, /匹配信息/);
});
