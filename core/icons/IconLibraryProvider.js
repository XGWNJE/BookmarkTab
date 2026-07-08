import { EXTENDED_ICONS } from './generated/extended-icons.generated.js';
import { GENERIC_ICONS } from './generated/generic-icons.generated.js';
import { LOGO_ICONS } from './generated/logo-icons.generated.js';
import { SIMPLE_ICONS } from './generated/simple-icons.generated.js';

export const ICON_MATCHER_VERSION = '2026-07-09-full-local-library-v4';

const DOMAIN_ALIASES = new Map([
  ['chat.openai.com', 'openai'],
  ['chatgpt.com', 'openai']
]);

const TITLE_BRAND_ALIASES = [
  {
    slug: 'qwen-color',
    terms: ['通义千问', '千问', 'qwen']
  },
  {
    slug: 'alibabacloud-color',
    terms: ['阿里云', '百炼', 'aliyun']
  },
  {
    slug: 'alibaba-color',
    terms: ['阿里巴巴', 'Alibaba']
  },
  {
    slug: 'antgroup-color',
    terms: ['蚂蚁集团', '蚂蚁']
  },
  {
    slug: 'tencentcloud-color',
    terms: ['腾讯云']
  },
  {
    slug: 'tencent-color',
    terms: ['腾讯']
  },
  {
    slug: 'wechat-pay-fill',
    terms: ['微信支付']
  },
  {
    slug: 'wechat-work-filled',
    terms: ['企业微信', 'WeCom']
  },
  {
    slug: 'wechat-fill',
    terms: ['微信', 'WeChat', 'weixin']
  },
  {
    slug: 'alipay-fill',
    terms: ['支付宝', 'Alipay']
  },
  {
    slug: 'taobao-fill',
    terms: ['淘宝', 'Taobao']
  },
  {
    slug: 'weibo-fill',
    terms: ['微博', 'Weibo']
  },
  {
    slug: 'zhihu-fill',
    terms: ['知乎', 'Zhihu']
  },
  {
    slug: 'bilibili-fill',
    terms: ['哔哩哔哩', 'B站', 'bilibili']
  },
  {
    slug: 'baidu-fill',
    terms: ['百度', 'Baidu']
  },
  {
    slug: 'dingding-fill',
    terms: ['钉钉', 'DingTalk', 'dingtalk']
  },
  {
    slug: 'qq-fill',
    terms: ['QQ', '腾讯QQ']
  },
  {
    slug: 'netease-cloud-music-fill',
    terms: ['网易云音乐']
  },
  {
    slug: 'bytedance-color',
    terms: ['字节跳动', 'ByteDance']
  },
  {
    slug: 'doubao-color',
    terms: ['豆包', 'Doubao']
  },
  {
    slug: 'kimi-color',
    terms: ['Kimi']
  },
  {
    slug: 'moonshot',
    terms: ['月之暗面', 'Moonshot']
  },
  {
    slug: 'deepseek-color',
    terms: ['DeepSeek', '深度求索']
  },
  {
    slug: 'zhipu-color',
    terms: ['智谱', '智谱清言', 'GLM']
  },
  {
    slug: 'minimax-color',
    terms: ['MiniMax', '海螺AI']
  },
  {
    slug: 'baichuan-color',
    terms: ['百川智能', '百川']
  },
  {
    slug: 'hunyuan-color',
    terms: ['腾讯混元', '混元']
  },
  {
    slug: 'qiniu-color',
    terms: ['七牛云', '七牛']
  },
  {
    slug: 'modelscope-color',
    terms: ['魔搭', 'ModelScope']
  },
  {
    slug: 'volcengine-color',
    terms: ['火山引擎']
  },
  {
    slug: 'iflytekcloud-color',
    terms: ['讯飞星火', '科大讯飞', 'iFLYTEK']
  },
  {
    slug: 'stepfun-color',
    terms: ['阶跃星辰', 'StepFun']
  },
  {
    slug: 'wenxin-color',
    terms: ['文心一言', '文心', 'ERNIE']
  }
];

const MULTI_PART_SUFFIXES = new Set([
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'co.uk',
  'com.au',
  'co.jp',
  'com.hk'
]);

const EXTENDED_AUTO_BRAND_SLUGS = new Set(TITLE_BRAND_ALIASES.map(alias => alias.slug));
const EXTENDED_AUTO_BRAND_ICONS = EXTENDED_ICONS.filter(icon => EXTENDED_AUTO_BRAND_SLUGS.has(icon.slug));
const BRAND_ICONS = [...SIMPLE_ICONS, ...EXTENDED_AUTO_BRAND_ICONS, ...LOGO_ICONS];
const ALL_LIBRARY_ICONS = [...SIMPLE_ICONS, ...EXTENDED_ICONS, ...LOGO_ICONS, ...GENERIC_ICONS];
const BRAND_ICONS_BY_SLUG = createIconMap(BRAND_ICONS);
const GENERIC_ICONS_BY_SLUG = createIconMap(GENERIC_ICONS);
const NORMALIZED_ICONS = ALL_LIBRARY_ICONS.map(icon => ({
  icon,
  slug: normalizeToken(icon.slug),
  title: normalizeToken(icon.title)
}));

const GENERIC_AUTO_ALIASES = new Map([
  ['api', 'braces'],
  ['archive', 'archive'],
  ['backup', 'archive'],
  ['book', 'book-open'],
  ['calendar', 'calendar'],
  ['chart', 'chart-line'],
  ['charts', 'chart-line'],
  ['cli', 'terminal'],
  ['cloud', 'cloud'],
  ['command', 'terminal'],
  ['console', 'terminal'],
  ['database', 'database'],
  ['db', 'database'],
  ['docs', 'book-open'],
  ['documentation', 'book-open'],
  ['download', 'download'],
  ['drive', 'hard-drive'],
  ['email', 'mail'],
  ['file', 'file-text'],
  ['files', 'files'],
  ['globe', 'globe'],
  ['help', 'circle-help'],
  ['image', 'image'],
  ['info', 'info'],
  ['kanban', 'kanban'],
  ['link', 'link'],
  ['mail', 'mail'],
  ['manual', 'book-open'],
  ['map', 'map'],
  ['music', 'music'],
  ['notes', 'notebook-text'],
  ['notification', 'bell'],
  ['notifications', 'bell'],
  ['package', 'package'],
  ['proxy', 'network'],
  ['report', 'chart-line'],
  ['reports', 'chart-line'],
  ['rss', 'rss'],
  ['schedule', 'calendar'],
  ['search', 'search'],
  ['security', 'shield'],
  ['server', 'server'],
  ['settings', 'settings'],
  ['shell', 'terminal'],
  ['sql', 'database'],
  ['table', 'table'],
  ['task', 'list-todo'],
  ['tasks', 'list-todo'],
  ['terminal', 'terminal'],
  ['upload', 'upload'],
  ['vps', 'server'],
  ['video', 'video'],
  ['wiki', 'book-open']
]);

const CJK_GENERIC_ALIASES = [
  {
    slug: 'database',
    terms: ['数据库', '数据表', '数据源', '数据仓库']
  },
  {
    slug: 'book-open',
    terms: ['文档', '帮助', '手册', '知识库', '教程', '说明', '指南']
  },
  {
    slug: 'braces',
    terms: ['接口', '开发者', '开发', '代码', '编程']
  },
  {
    slug: 'files',
    terms: ['网盘', '文件', '文件夹', '资源']
  },
  {
    slug: 'bot',
    terms: ['智能体', '助手', '聊天', '对话', '大模型', '模型', '机器人', '豆包', 'kimi']
  },
  {
    slug: 'cloud',
    terms: ['云服务', '云平台']
  },
  {
    slug: 'server',
    terms: ['VPS', '服务器', '主机', '托管', '虚拟主机']
  },
  {
    slug: 'network',
    terms: ['代理', '网络', '节点']
  },
  {
    slug: 'layout-dashboard',
    terms: ['控制台', '仪表盘', '看板']
  },
  {
    slug: 'chart-line',
    terms: ['报表', '统计', '分析', '图表']
  },
  {
    slug: 'mail',
    terms: ['邮件', '邮箱']
  },
  {
    slug: 'image',
    terms: ['图片', '图像', '绘图', '刷图', '绘画', '作图', '画图']
  },
  {
    slug: 'video',
    terms: ['视频']
  },
  {
    slug: 'shield',
    terms: ['安全', '权限', '风控']
  },
  {
    slug: 'key',
    terms: ['密钥', '密码', '令牌']
  },
  {
    slug: 'search',
    terms: ['搜索', '查询']
  },
  {
    slug: 'download',
    terms: ['下载']
  },
  {
    slug: 'upload',
    terms: ['上传']
  },
  {
    slug: 'calendar',
    terms: ['日历', '排期', '计划']
  }
];

const DOMAIN_STOP_TOKENS = new Set([
  'www',
  'm',
  'mobile',
  'app',
  'apps',
  'admin',
  'dashboard',
  'console',
  'portal',
  'tool',
  'tools',
  'internal',
  'local',
  'localhost',
  'example',
  'com',
  'net',
  'org',
  'cn',
  'io',
  'dev'
]);

function normalizeToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function createIconMap(icons) {
  const map = new Map();
  for (const icon of icons) {
    const key = normalizeToken(icon.slug);
    if (!map.has(key)) {
      map.set(key, icon);
    }
  }
  return map;
}

function splitTokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(normalizeToken)
    .filter(token => token.length >= 2);
}

function uniqueTokens(values) {
  return [...new Set(values.filter(Boolean))];
}

function getHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isIpHostname(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
}

function getUrlParts(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function getDisplayUrl(url) {
  const parsed = getUrlParts(url);
  if (parsed) {
    return `${parsed.origin}${parsed.pathname}`;
  }
  return String(url || '').split(/[?#]/)[0];
}

function getPrimaryDomainPart(hostname) {
  if (!hostname || isIpHostname(hostname)) return '';
  const parts = hostname.split('.').filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];

  const lastTwo = parts.slice(-2).join('.');
  const index = MULTI_PART_SUFFIXES.has(lastTwo) ? parts.length - 3 : parts.length - 2;
  const candidate = parts[Math.max(0, index)];
  return ['www', 'm', 'mobile'].includes(candidate) ? parts[0] : candidate;
}

function getPrimaryDomainToken(hostname) {
  return normalizeToken(getPrimaryDomainPart(hostname));
}

function getDomainSuffixStartIndex(parts) {
  if (parts.length <= 1) return parts.length;
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_SUFFIXES.has(lastTwo) ? Math.max(0, parts.length - 2) : parts.length - 1;
}

function domainTokens(hostname) {
  if (!hostname || isIpHostname(hostname)) return [];
  const values = [];
  const parts = hostname.split('.').filter(Boolean);
  const suffixStartIndex = getDomainSuffixStartIndex(parts);
  for (let index = 0; index < parts.length; index += 1) {
    if (index >= suffixStartIndex) continue;
    const part = parts[index];
    const normalizedPart = normalizeToken(part);
    if (normalizedPart.length >= 2 && !DOMAIN_STOP_TOKENS.has(normalizedPart)) {
      values.push(normalizedPart);
    }
    values.push(...splitTokens(part).filter(token => !DOMAIN_STOP_TOKENS.has(token)));
  }
  return uniqueTokens(values);
}

function pathTokens(url) {
  const parsed = getUrlParts(url);
  if (!parsed?.pathname) return [];

  const values = [];
  for (const segment of parsed.pathname.split('/').filter(Boolean)) {
    const normalizedSegment = normalizeToken(segment);
    if (normalizedSegment.length >= 2) {
      values.push(normalizedSegment);
    }
    values.push(...splitTokens(segment));
  }
  return uniqueTokens(values);
}

function titleTokens(title) {
  return uniqueTokens(splitTokens(title));
}

function titlePhraseSlug(title) {
  const normalized = normalizeToken(title);
  return normalized.length >= 2 ? normalized : '';
}

function textAliasMatches(value, aliasGroups) {
  const text = String(value || '').trim();
  if (!text) return [];
  const normalizedText = text.toLocaleLowerCase();
  const matches = [];
  const seen = new Set();

  for (const group of aliasGroups) {
    for (const term of group.terms) {
      const normalizedTerm = String(term).toLocaleLowerCase();
      if (!normalizedTerm || !normalizedText.includes(normalizedTerm)) continue;

      const key = `${group.slug}:${term}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({
        value: term,
        slug: group.slug
      });
    }
  }

  return matches;
}

function titleBrandAliases(title) {
  return textAliasMatches(title, TITLE_BRAND_ALIASES);
}

function titleGenericAliases(title) {
  return textAliasMatches(title, CJK_GENERIC_ALIASES);
}

function toCandidate(icon, confidence, matchReason) {
  return {
    id: `${icon.source}:${icon.slug}`,
    slug: icon.slug,
    title: icon.title,
    color: icon.color,
    source: icon.source,
    sourceLabel: icon.sourceLabel,
    sourceUrl: icon.sourceUrl,
    license: icon.license,
    type: 'svg',
    svg: icon.svg,
    confidence,
    matchReason
  };
}

function findBrandBySlug(slug, matchReason) {
  const icon = BRAND_ICONS_BY_SLUG.get(normalizeToken(slug));
  return icon ? toCandidate(icon, 1, matchReason) : null;
}

function findGenericBySlug(slug, matchReason) {
  const icon = GENERIC_ICONS_BY_SLUG.get(normalizeToken(slug));
  return icon ? toCandidate(icon, 0.74, matchReason) : null;
}

function createMatchDetail(query, matchType, score) {
  return {
    source: query.source,
    sourceLabel: query.sourceLabel,
    value: query.value,
    normalized: query.normalized,
    matchType,
    score
  };
}

function addQuery(queries, source, sourceLabel, value, score) {
  const normalized = normalizeToken(value);
  if (!normalized || normalized.length < 2) return;
  const key = `${source}:${normalized}`;
  if (queries.some(query => query.key === key)) return;
  queries.push({
    key,
    source,
    sourceLabel,
    value,
    normalized,
    score
  });
}

function addAliasQuery(queries, source, sourceLabel, value, aliasSlug, score) {
  const normalized = normalizeToken(aliasSlug);
  if (!normalized || normalized.length < 2) return;
  const key = `${source}:${normalizeToken(value)}:${normalized}`;
  if (queries.some(query => query.key === key)) return;
  queries.push({
    key,
    source,
    sourceLabel,
    value,
    normalized,
    score
  });
}

function addGenericAliasQueries(queries, tokens, score, source = 'generic-token', sourceLabel = '通用词') {
  tokens.forEach(token => {
    const aliasSlug = GENERIC_AUTO_ALIASES.get(token);
    if (aliasSlug) {
      addAliasQuery(queries, source, sourceLabel, token, aliasSlug, score);
    }
  });
}

function buildCandidateQueries(signals, manualQuery = '') {
  const queries = [];

  if (signals.aliasSlug) {
    addQuery(queries, 'domain-alias', '域名别名', signals.aliasHostname, 100);
    queries[queries.length - 1].normalized = signals.aliasSlug;
  }

  addQuery(queries, 'title-phrase', '标题完整短语', signals.title, 96);
  addQuery(queries, 'primary-domain', '主域名', signals.primaryDomainRaw || signals.primaryDomain, 90);

  signals.titleBrandAliases.forEach(alias => (
    addAliasQuery(queries, 'title-alias', '标题别名', alias.value, alias.slug, 94)
  ));
  signals.titleGenericAliases.forEach(alias => (
    addAliasQuery(queries, 'cjk-generic-token', '中文通用词', alias.value, alias.slug, 84)
  ));
  signals.titleTokens.forEach(token => addQuery(queries, 'title-token', '标题词', token, 86));
  signals.domainTokens.forEach(token => addQuery(queries, 'domain-token', '域名片段', token, 78));
  signals.pathTokens.forEach(token => addQuery(queries, 'path-token', '路径片段', token, 72));
  addGenericAliasQueries(queries, signals.titleTokens, 82);
  addGenericAliasQueries(queries, signals.pathTokens, 70);

  const manualTokens = splitTokens(manualQuery);
  titleBrandAliases(manualQuery).forEach(alias => (
    addAliasQuery(queries, 'manual-brand-alias', '手动别名', alias.value, alias.slug, 98)
  ));
  titleGenericAliases(manualQuery).forEach(alias => (
    addAliasQuery(queries, 'manual-cjk-generic-token', '手动通用词', alias.value, alias.slug, 88)
  ));
  manualTokens.forEach(token => addQuery(queries, 'manual-query', '手动关键词', token, 88));
  addGenericAliasQueries(queries, manualTokens, 80, 'manual-generic-token', '手动通用词');

  return queries;
}

function queryMatchesIcon(query, normalizedIcon) {
  if (!query.normalized) return null;
  if (normalizedIcon.slug === query.normalized || normalizedIcon.title === query.normalized) {
    return { matchType: '精确匹配', score: query.score };
  }
  const iconSlugCanBeContained = normalizedIcon.slug.length >= 3;
  const iconTitleCanBeContained = normalizedIcon.title.length >= 3;
  if (
    (iconSlugCanBeContained && query.normalized.includes(normalizedIcon.slug)) ||
    (iconTitleCanBeContained && query.normalized.includes(normalizedIcon.title))
  ) {
    return { matchType: '包含品牌名', score: Math.max(40, query.score - 12) };
  }
  const queryCanMatchInsideCandidate = query.normalized.length >= 3;
  if (
    queryCanMatchInsideCandidate &&
    (normalizedIcon.slug.includes(query.normalized) || normalizedIcon.title.includes(query.normalized))
  ) {
    return { matchType: '候选包含关键词', score: Math.max(35, query.score - 24) };
  }
  return null;
}

function mergeCandidate(candidateMap, normalizedIcon, detail) {
  const { icon } = normalizedIcon;
  const id = `${icon.source}:${icon.slug}`;
  const existing = candidateMap.get(id);
  if (!existing) {
    candidateMap.set(id, {
      ...toCandidate(icon, Math.min(0.99, detail.score / 100), `${detail.source}:${detail.normalized}`),
      matchScore: detail.score,
      matchDetails: [detail]
    });
    return;
  }

  existing.matchScore = Math.max(existing.matchScore, detail.score);
  existing.confidence = Math.max(existing.confidence, Math.min(0.99, detail.score / 100));
  const detailKey = `${detail.source}:${detail.normalized}:${detail.matchType}`;
  const hasDetail = existing.matchDetails.some(item => (
    `${item.source}:${item.normalized}:${item.matchType}` === detailKey
  ));
  if (!hasDetail) {
    existing.matchDetails.push(detail);
  }
  existing.matchDetails.sort((a, b) => b.score - a.score);
  existing.matchReason = `${existing.matchDetails[0].source}:${existing.matchDetails[0].normalized}`;
}

function hasManualMatch(candidate) {
  return candidate.matchDetails?.some(detail => detail.source.startsWith('manual-'));
}

function findGenericIcon(bookmark) {
  for (const alias of titleGenericAliases(bookmark?.title)) {
    const icon = findGenericBySlug(alias.slug, `generic:title:${alias.value}`);
    if (icon) return icon;
  }

  const title = titleTokens(bookmark?.title);
  for (const token of title) {
    const aliasSlug = GENERIC_AUTO_ALIASES.get(token);
    if (!aliasSlug) continue;
    const icon = findGenericBySlug(aliasSlug, `generic:title:${token}`);
    if (icon) return icon;
  }

  const path = pathTokens(bookmark?.url);
  for (const token of path) {
    const aliasSlug = GENERIC_AUTO_ALIASES.get(token);
    if (!aliasSlug) continue;
    const icon = findGenericBySlug(aliasSlug, `generic:path:${token}`);
    if (icon) return icon;
  }

  return null;
}

export function getBookmarkIconSignals(bookmark) {
  const title = String(bookmark?.title || '').trim();
  const url = String(bookmark?.url || '').trim();
  const hostname = getHostname(url);
  const primaryDomainRaw = getPrimaryDomainPart(hostname);
  const aliasSlug = DOMAIN_ALIASES.get(hostname) || '';

  return {
    title,
    urlForDisplay: getDisplayUrl(url),
    hostname: hostname.replace(/^www\./, ''),
    primaryDomain: normalizeToken(primaryDomainRaw),
    primaryDomainRaw,
    titlePhrase: titlePhraseSlug(title),
    titleBrandAliases: titleBrandAliases(title),
    titleGenericAliases: titleGenericAliases(title),
    titleTokens: titleTokens(title),
    domainTokens: domainTokens(hostname),
    pathTokens: pathTokens(url),
    aliasHostname: aliasSlug ? hostname : '',
    aliasSlug
  };
}

export function getLibraryIconCandidates(bookmark, options = {}) {
  const limit = options.limit || 48;
  const signals = getBookmarkIconSignals(bookmark);
  const manualQuery = String(options.query || '').trim();
  const queries = buildCandidateQueries(signals, manualQuery);
  const candidateMap = new Map();

  for (const query of queries) {
    for (const normalizedIcon of NORMALIZED_ICONS) {
      const match = queryMatchesIcon(query, normalizedIcon);
      if (!match) continue;
      mergeCandidate(candidateMap, normalizedIcon, createMatchDetail(query, match.matchType, match.score));
    }
  }

  const candidates = [...candidateMap.values()]
    .filter(candidate => !manualQuery || hasManualMatch(candidate))
    .sort((a, b) => (
      b.matchScore - a.matchScore ||
      a.title.localeCompare(b.title, 'en')
    ))
    .slice(0, limit);

  return {
    signals,
    queries: queries.map(({ key: _key, ...query }) => query),
    candidates
  };
}

export function findLibraryIcon(bookmark) {
  const hostname = getHostname(bookmark?.url);
  const aliasSlug = DOMAIN_ALIASES.get(hostname);
  if (aliasSlug) {
    return findBrandBySlug(aliasSlug, `alias:${hostname}`);
  }

  const titlePhrase = titlePhraseSlug(bookmark?.title);
  if (titlePhrase) {
    const icon = findBrandBySlug(titlePhrase, `title:${titlePhrase}`);
    if (icon) return icon;
  }

  for (const alias of titleBrandAliases(bookmark?.title)) {
    const icon = findBrandBySlug(alias.slug, `title-alias:${alias.value}`);
    if (icon) return icon;
  }

  const primaryDomain = getPrimaryDomainToken(hostname);
  if (primaryDomain) {
    const icon = findBrandBySlug(primaryDomain, `domain:${hostname}`);
    if (icon) return icon;
  }

  for (const token of titleTokens(bookmark?.title)) {
    const icon = findBrandBySlug(token, `title:${token}`);
    if (icon) return icon;
  }

  return findGenericIcon(bookmark);
}

export function searchLibraryIcons(query, options = {}) {
  const limit = options.limit || 24;
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) return [];

  return ALL_LIBRARY_ICONS
    .map(icon => {
      const slug = normalizeToken(icon.slug);
      const title = normalizeToken(icon.title);
      let score = 0;

      if (slug === normalizedQuery || title === normalizedQuery) {
        score = 100;
      } else if (slug.startsWith(normalizedQuery) || title.startsWith(normalizedQuery)) {
        score = 86;
      } else if (slug.includes(normalizedQuery) || title.includes(normalizedQuery)) {
        score = 64;
      }

      return { icon, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => (
      b.score - a.score ||
      a.icon.title.localeCompare(b.icon.title, 'en') ||
      a.icon.slug.localeCompare(b.icon.slug, 'en')
    ))
    .slice(0, limit)
    .map(({ icon, score }) => toCandidate(icon, Math.min(0.9, score / 100), `search:${normalizedQuery}`));
}

export const iconLibraryStats = Object.freeze({
  source: 'local-icon-library',
  count: ALL_LIBRARY_ICONS.length,
  brandCount: BRAND_ICONS.length,
  extendedCount: EXTENDED_ICONS.length,
  genericCount: GENERIC_ICONS.length,
  sources: [
    { source: 'simple-icons', sourceLabel: 'Simple Icons', count: SIMPLE_ICONS.length },
    { source: 'iconify-logos', sourceLabel: 'Iconify Logos', count: LOGO_ICONS.length },
    { source: 'extended-icon-libraries', sourceLabel: 'Extended Icon Libraries', count: EXTENDED_ICONS.length },
    { source: 'generic-icons', sourceLabel: 'Lucide Icons', count: GENERIC_ICONS.length }
  ]
});
