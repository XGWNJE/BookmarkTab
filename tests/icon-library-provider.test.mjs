import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import test from 'node:test';

import {
  findLibraryIcon,
  getLibraryIconCandidates,
  iconLibraryStats,
  searchLibraryIcons
} from '../core/icons/IconLibraryProvider.js';

test('findLibraryIcon matches known brand by domain', () => {
  const icon = findLibraryIcon({
    title: 'Repository',
    url: 'https://github.com/XGWNJE/BookmarkTab'
  });

  assert.equal(icon.id, 'simple-icons:github');
  assert.equal(icon.title, 'GitHub');
  assert.equal(icon.source, 'simple-icons');
  assert.equal(icon.type, 'svg');
  assert.match(icon.svg, /^<svg\b/);
  assert.equal(icon.confidence, 1);
  assert.equal(icon.matchReason, 'domain:github.com');
});

test('findLibraryIcon matches curated aliases for nonstandard domains', () => {
  const icon = findLibraryIcon({
    title: 'ChatGPT',
    url: 'https://chat.openai.com/'
  });

  assert.equal(icon.id, 'simple-icons:openai');
  assert.equal(icon.title, 'OpenAI');
  assert.equal(icon.matchReason, 'alias:chat.openai.com');
});

test('findLibraryIcon matches by title token when URL is nonstandard', () => {
  const icon = findLibraryIcon({
    title: 'GitHub Actions Panel',
    url: 'http://192.168.31.10:8080/actions'
  });

  assert.equal(icon.id, 'simple-icons:github');
  assert.equal(icon.matchReason, 'title:github');
});

test('findLibraryIcon matches brand phrase from bookmark title on vendor tool domains', () => {
  const icon = findLibraryIcon({
    title: 'OpenAI Billing Console',
    url: 'https://billing.vendor-tools.example/internal'
  });

  assert.equal(icon.id, 'simple-icons:openai');
  assert.equal(icon.matchReason, 'title:openai');
});

test('findLibraryIcon prefers exact title phrase over broad title token', () => {
  const icon = findLibraryIcon({
    title: 'Google Search Console',
    url: 'https://tools.example.internal/search'
  });

  assert.equal(icon.id, 'simple-icons:googlesearchconsole');
  assert.equal(icon.matchReason, 'title:googlesearchconsole');
});

test('findLibraryIcon does not auto-apply broad ambiguous matches', () => {
  const icon = findLibraryIcon({
    title: 'Internal Tool',
    url: 'http://192.168.31.11/'
  });

  assert.equal(icon, null);
});

test('findLibraryIcon falls back to generic tool icons for non-brand bookmarks', () => {
  const icon = findLibraryIcon({
    title: 'Database Backup',
    url: 'http://192.168.31.12/backup'
  });

  assert.equal(icon.id, 'generic-icons:database');
  assert.equal(icon.source, 'generic-icons');
  assert.equal(icon.sourceLabel, 'Lucide Icons');
  assert.equal(icon.matchReason, 'generic:title:database');
});

test('findLibraryIcon matches Chinese generic title aliases for non-brand bookmarks', () => {
  const icon = findLibraryIcon({
    title: '数据库备份',
    url: 'http://192.168.31.12/'
  });

  assert.equal(icon.id, 'generic-icons:database');
  assert.equal(icon.sourceLabel, 'Lucide Icons');
  assert.equal(icon.matchReason, 'generic:title:数据库');
});

test('findLibraryIcon matches Chinese cloud brand aliases on vendor tool domains', () => {
  const icon = findLibraryIcon({
    title: '阿里云百炼控制台',
    url: 'https://bailian.console.aliyun.com/'
  });

  assert.equal(icon.id, 'lobe-icons:alibabacloud-color');
  assert.equal(icon.matchReason, 'title-alias:阿里云');
});

test('findLibraryIcon matches Chinese brands from expanded icon libraries', () => {
  const cases = [
    {
      bookmark: { title: '钉钉开放平台', url: 'https://open.dingtalk.com/' },
      expectedId: 'remix-icons:dingding-fill',
      expectedReason: 'title-alias:钉钉'
    },
    {
      bookmark: { title: '微博热搜', url: 'https://weibo.com/' },
      expectedId: 'remix-icons:weibo-fill',
      expectedReason: 'title-alias:微博'
    },
    {
      bookmark: { title: '豆包', url: 'https://www.doubao.com/chat/' },
      expectedId: 'lobe-icons:doubao-color',
      expectedReason: 'title-alias:豆包'
    },
    {
      bookmark: { title: 'Kimi', url: 'https://kimi.moonshot.cn/' },
      expectedId: 'lobe-icons:kimi-color',
      expectedReason: 'title-alias:Kimi'
    },
    {
      bookmark: { title: '腾讯云控制台', url: 'https://console.cloud.tencent.com/' },
      expectedId: 'lobe-icons:tencentcloud-color',
      expectedReason: 'title-alias:腾讯云'
    },
    {
      bookmark: { title: '火山引擎控制台', url: 'https://console.volcengine.com/' },
      expectedId: 'lobe-icons:volcengine-color',
      expectedReason: 'title-alias:火山引擎'
    },
    {
      bookmark: { title: '七牛云对象存储', url: 'https://portal.qiniu.com/' },
      expectedId: 'lobe-icons:qiniu-color',
      expectedReason: 'title-alias:七牛云'
    }
  ];

  for (const item of cases) {
    const icon = findLibraryIcon(item.bookmark);
    assert.equal(icon.id, item.expectedId);
    assert.equal(icon.matchReason, item.expectedReason);
  }
});

test('findLibraryIcon matches common Chinese utility concepts', () => {
  const cases = [
    {
      bookmark: { title: 'GrsAI GPT4o刷图 绘画', url: 'https://image.grsai.ai/' },
      expectedId: 'generic-icons:image',
      expectedReason: 'generic:title:刷图'
    },
    {
      bookmark: { title: 'VPS 托管 - BandwagonHost VPS', url: 'https://bandwagonhost.com/clientarea.php' },
      expectedId: 'generic-icons:server',
      expectedReason: 'generic:title:VPS'
    },
    {
      bookmark: { title: '静态住宅代理 - IPRoyal', url: 'https://dashboard.iproyal.com/' },
      expectedId: 'generic-icons:network',
      expectedReason: 'generic:title:代理'
    },
    {
      bookmark: { title: '网盘KK资源分享', url: 'https://kkpans.com/' },
      expectedId: 'generic-icons:files',
      expectedReason: 'generic:title:网盘'
    }
  ];

  for (const item of cases) {
    const icon = findLibraryIcon(item.bookmark);
    assert.equal(icon.id, item.expectedId);
    assert.equal(icon.matchReason, item.expectedReason);
  }
});

test('findLibraryIcon keeps explicit brand matches ahead of generic matches', () => {
  const icon = findLibraryIcon({
    title: 'GitHub Database Reports',
    url: 'http://192.168.31.13/reports'
  });

  assert.equal(icon.id, 'simple-icons:github');
  assert.equal(icon.matchReason, 'title:github');
});

test('searchLibraryIcons returns lower-confidence manual candidates from all local sets', () => {
  const icons = searchLibraryIcons('git', { limit: 5 });

  assert.ok(icons.length > 0);
  assert.ok(icons.some(icon => icon.source === 'remix-icons'));
  assert.ok(icons.every(icon => icon.confidence < 1));
});

test('searchLibraryIcons returns generic candidates for non-brand concepts', () => {
  const icons = searchLibraryIcons('database', { limit: 12 });

  const database = icons.find(icon => icon.id === 'generic-icons:database');
  assert.ok(database);
  assert.equal(database.sourceLabel, 'Lucide Icons');
});

test('searchLibraryIcons returns Chinese brand candidates', () => {
  const icons = searchLibraryIcons('doubao', { limit: 12 });

  const doubao = icons.find(icon => icon.id === 'lobe-icons:doubao-color');
  assert.ok(doubao);
  assert.equal(doubao.sourceLabel, 'Lobe Icons');
});

test('searchLibraryIcons covers full local Remix, Ant Design, and Lobe sets', () => {
  const remixIcons = searchLibraryIcons('ancient gate', { limit: 20 });
  const antIcons = searchLibraryIcons('account book', { limit: 20 });
  const lobeIcons = searchLibraryIcons('ace', { limit: 20 });

  assert.ok(remixIcons.some(icon => icon.id === 'remix-icons:ancient-gate-fill'));
  assert.ok(antIcons.some(icon => icon.id === 'ant-design-icons:account-book-filled'));
  assert.ok(lobeIcons.some(icon => icon.id === 'lobe-icons:ace'));
});

test('iconLibraryStats reports brand and generic sources', () => {
  assert.ok(iconLibraryStats.sources.some(source => source.source === 'simple-icons' && source.count > 3000));
  assert.ok(iconLibraryStats.sources.some(source => source.source === 'iconify-logos' && source.count > 500));
  assert.ok(iconLibraryStats.sources.some(source => source.source === 'extended-icon-libraries' && source.count > 4900));
  assert.ok(iconLibraryStats.sources.some(source => source.source === 'generic-icons' && source.count > 100));
});

test('generated full local extension library stays below 100MB', () => {
  const size = statSync(new URL('../core/icons/generated/extended-icons.generated.js', import.meta.url)).size;

  assert.ok(size < 100 * 1024 * 1024);
});

test('library candidates keep brand color metadata and colored SVG', () => {
  const icon = findLibraryIcon({
    title: 'Google Search Console',
    url: 'https://tools.example.internal/search'
  });

  assert.match(icon.color, /^[0-9A-F]{6}$/i);
  assert.notEqual(icon.color, '000000');
  assert.match(icon.svg, /fill="#[0-9A-F]{6}"/i);
  assert.doesNotMatch(icon.svg, /fill="currentColor"/);
});

test('getLibraryIconCandidates exposes bookmark signals and local match reasons', () => {
  const result = getLibraryIconCandidates({
    title: 'OpenAI Billing Console',
    url: 'https://billing.vendor-tools.example/internal/openai-usage?token=secret#private'
  }, { limit: 12 });

  assert.equal(result.signals.title, 'OpenAI Billing Console');
  assert.equal(result.signals.hostname, 'billing.vendor-tools.example');
  assert.equal(result.signals.primaryDomain, 'vendortools');
  assert.ok(result.signals.titleTokens.includes('openai'));
  assert.ok(result.signals.pathTokens.includes('openai'));
  assert.doesNotMatch(result.signals.urlForDisplay, /token=secret/);

  const openai = result.candidates.find(icon => icon.id === 'simple-icons:openai');
  assert.ok(openai);
  assert.ok(openai.matchDetails.some(detail => detail.sourceLabel === '标题词' && detail.value === 'openai'));
  assert.ok(openai.matchDetails.some(detail => detail.sourceLabel === '路径片段' && detail.value === 'openai'));
});

test('getLibraryIconCandidates accepts an extra manual query without changing automatic matching', () => {
  const autoIcon = findLibraryIcon({
    title: 'Internal Tool',
    url: 'http://192.168.31.10:8080/actions'
  });

  assert.equal(autoIcon, null);

  const result = getLibraryIconCandidates({
    title: 'Internal Tool',
    url: 'http://192.168.31.10:8080/actions'
  }, { query: 'github', limit: 8 });

  const github = result.candidates.find(icon => icon.id === 'simple-icons:github');
  assert.ok(github);
  assert.ok(github.matchDetails.some(detail => detail.sourceLabel === '手动关键词' && detail.value === 'github'));
});

test('getLibraryIconCandidates treats manual query as a local candidate filter', () => {
  const result = getLibraryIconCandidates({
    title: 'OpenAI Billing Console',
    url: 'https://billing.vendor-tools.example/internal/openai-usage'
  }, { query: 'github', limit: 8 });

  assert.ok(result.candidates.length > 0);
  assert.ok(result.candidates.some(icon => (
    icon.id === 'simple-icons:github' ||
    icon.id === 'iconify-logos:github' ||
    icon.id === 'lobe-icons:github'
  )));
  assert.equal(result.candidates.some(icon => icon.id === 'simple-icons:openai'), false);
  assert.ok(result.candidates.every(icon => (
    icon.matchDetails.some(detail => detail.source.startsWith('manual-'))
  )));
});

test('getLibraryIconCandidates accepts Chinese manual aliases', () => {
  const brandResult = getLibraryIconCandidates({
    title: 'Internal Tool',
    url: 'http://192.168.31.10/'
  }, { query: '豆包', limit: 8 });

  const doubao = brandResult.candidates.find(icon => icon.id === 'lobe-icons:doubao-color');
  assert.ok(doubao);
  assert.ok(doubao.matchDetails.some(detail => detail.source === 'manual-brand-alias' && detail.value === '豆包'));

  const genericResult = getLibraryIconCandidates({
    title: 'Internal Tool',
    url: 'http://192.168.31.10/'
  }, { query: '文档', limit: 8 });

  const docs = genericResult.candidates.find(icon => icon.id === 'generic-icons:book-open');
  assert.ok(docs);
  assert.ok(docs.matchDetails.some(detail => detail.source === 'manual-cjk-generic-token' && detail.value === '文档'));
});

test('getLibraryIconCandidates includes generic match details', () => {
  const result = getLibraryIconCandidates({
    title: 'API Documentation',
    url: 'http://192.168.31.14/docs/api'
  }, { limit: 16 });

  const docs = result.candidates.find(icon => icon.id === 'generic-icons:book-open');
  assert.ok(docs);
  assert.ok(docs.matchDetails.some(detail => detail.sourceLabel === '通用词' && detail.value === 'documentation'));
});

test('getLibraryIconCandidates exposes Chinese generic alias details', () => {
  const result = getLibraryIconCandidates({
    title: '接口文档',
    url: 'http://192.168.31.14/'
  }, { limit: 16 });

  const docs = result.candidates.find(icon => icon.id === 'generic-icons:book-open');
  assert.ok(docs);
  assert.ok(result.queries.some(query => query.sourceLabel === '中文通用词' && query.value === '文档'));
  assert.ok(docs.matchDetails.some(detail => detail.sourceLabel === '中文通用词' && detail.value === '文档'));
});

test('getLibraryIconCandidates exposes Chinese brand source details', () => {
  const result = getLibraryIconCandidates({
    title: '豆包 API 控制台',
    url: 'https://www.doubao.com/chat/'
  }, { limit: 16 });

  const doubao = result.candidates.find(icon => icon.id === 'lobe-icons:doubao-color');
  assert.ok(doubao);
  assert.equal(doubao.sourceLabel, 'Lobe Icons');
  assert.ok(result.queries.some(query => query.sourceLabel === '标题别名' && query.value === '豆包'));
  assert.ok(doubao.matchDetails.some(detail => detail.sourceLabel === '标题别名' && detail.value === '豆包'));
});

test('findLibraryIcon does not auto-apply non-brand icons from expanded local sets', () => {
  const icon = findLibraryIcon({
    title: 'Ancient Gate',
    url: 'http://192.168.31.15/'
  });

  assert.equal(icon, null);
});

test('getLibraryIconCandidates does not match single-letter icons from long queries', () => {
  const result = getLibraryIconCandidates({
    title: 'clawhub workspace',
    url: 'https://clawhub.ai/'
  }, { limit: 48 });

  const singleLetterMatches = result.candidates.filter(icon => (
    icon.source !== 'generic-icons' &&
    icon.slug.length === 1 &&
    icon.matchDetails.some(detail => detail.matchType === '包含品牌名')
  ));

  assert.deepEqual(singleLetterMatches.map(icon => icon.id), []);
});

test('getLibraryIconCandidates ignores domain suffix labels as candidate signals', () => {
  const result = getLibraryIconCandidates({
    title: 'ClawHub',
    url: 'https://clawhub.ai/'
  }, { limit: 48 });

  assert.equal(result.queries.some(query => query.source === 'domain-token' && query.value === 'ai'), false);
  assert.equal(result.candidates.some(icon => icon.id === 'iconify-logos:ai'), false);
});

test('getLibraryIconCandidates does not expand short title tokens by containment', () => {
  const result = getLibraryIconCandidates({
    title: 'CG资源网',
    url: 'https://cgown.com/'
  }, { limit: 48 });

  const shortTokenContainment = result.candidates.filter(icon => (
    icon.matchDetails.some(detail => detail.normalized === 'cg' && detail.matchType === '候选包含关键词')
  ));

  assert.deepEqual(shortTokenContainment.map(icon => icon.id), []);
});
