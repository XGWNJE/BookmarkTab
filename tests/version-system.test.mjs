import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8');
}

test('version metadata is documented from the manifest version', async () => {
  const manifest = JSON.parse(await readProjectFile('manifest.json'));
  const readme = await readProjectFile('README.md');
  const changelog = await readProjectFile('CHANGELOG.md');
  const agents = await readProjectFile('AGENTS.md');
  const version = manifest.version;

  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.match(readme, new RegExp(`当前版本：\\\`${version}\\\``));
  assert.match(readme, /\[完整变更记录\]\(CHANGELOG\.md\)/);
  assert.match(changelog, new RegExp(`## \\[${version}\\] - \\d{4}-\\d{2}-\\d{2}`));
  assert.match(changelog, /## \[Unreleased\]/);
  assert.match(agents, /manifest\.json` 的 `version` 是安装版本号来源/);
  assert.match(agents, /README 只保留当前版本摘要并链接 `CHANGELOG\.md`/);
});
