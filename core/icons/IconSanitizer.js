const DISALLOWED_ELEMENTS = [
  'script',
  'iframe',
  'foreignObject',
  'object',
  'embed',
  'link',
  'style',
  'image',
  'use'
];

const DISALLOWED_PAIRED_ELEMENT_RE = new RegExp(
  `<(${DISALLOWED_ELEMENTS.join('|')})\\b[\\s\\S]*?<\\/\\1>`,
  'gi'
);
const DISALLOWED_SELF_CLOSING_ELEMENT_RE = new RegExp(
  `<(?:${DISALLOWED_ELEMENTS.join('|')})\\b[^>]*\\/?>`,
  'gi'
);

const EVENT_ATTRIBUTE_RE = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const STYLE_ATTRIBUTE_RE = /\s+style\s*=\s*(?:"[^"]*(?:url\(|expression\(|javascript:|data:)[^"]*"|'[^']*(?:url\(|expression\(|javascript:|data:)[^']*'|[^\s>]*(?:url\(|expression\(|javascript:|data:)[^\s>]*)/gi;
const UNSAFE_URL_ATTRIBUTE_RE = /\s+(?:href|xlink:href)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|(?!#)[^\s>]+)/gi;
const JAVASCRIPT_OR_DATA_ATTRIBUTE_RE = /\s+[a-z_:.-]+\s*=\s*(?:"[^"]*(?:javascript:|data:)[^"]*"|'[^']*(?:javascript:|data:)[^']*'|[^\s>]*(?:javascript:|data:)[^\s>]*)/gi;

export function isSvgRaw(value) {
  return typeof value === 'string' && value.trimStart().startsWith('<svg');
}

export function sanitizeSvg(raw) {
  if (!isSvgRaw(raw)) return null;

  const trimmed = raw.trim();
  if (!/^<svg\b[\s\S]*<\/svg>$/i.test(trimmed) && !/^<svg\b[\s\S]*\/>$/i.test(trimmed)) {
    return null;
  }

  const sanitized = trimmed
    .replace(DISALLOWED_PAIRED_ELEMENT_RE, '')
    .replace(DISALLOWED_SELF_CLOSING_ELEMENT_RE, '')
    .replace(EVENT_ATTRIBUTE_RE, '')
    .replace(STYLE_ATTRIBUTE_RE, '')
    .replace(UNSAFE_URL_ATTRIBUTE_RE, '')
    .replace(JAVASCRIPT_OR_DATA_ATTRIBUTE_RE, '');

  if (!/^<svg\b/i.test(sanitized) || /<parsererror\b/i.test(sanitized)) return null;
  return sanitized;
}
