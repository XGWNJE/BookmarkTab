import { readFile, readdir, writeFile } from 'node:fs/promises';

import antDesignIcons from '@iconify-json/ant-design/icons.json' with { type: 'json' };
import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' };
import iconifyLogos from '@iconify-json/logos/icons.json' with { type: 'json' };
import remixIcons from '@iconify-json/ri/icons.json' with { type: 'json' };
import iconifySimpleIcons from '@iconify-json/simple-icons/icons.json' with { type: 'json' };
import * as simpleIcons from 'simple-icons';

const ADDITIONAL_BRANDS = [
  {
    slug: 'openai',
    title: 'OpenAI',
    color: '10A37F',
    sourceUrl: 'https://icon-sets.iconify.design/simple-icons/openai/'
  }
];

const EXTENDED_ICONIFY_COLLECTIONS = [
  {
    icons: remixIcons,
    source: 'remix-icons',
    sourceLabel: 'Remix Icon',
    sourceUrlPrefix: 'https://icon-sets.iconify.design/ri/',
    license: 'Apache-2.0'
  },
  {
    icons: antDesignIcons,
    source: 'ant-design-icons',
    sourceLabel: 'Ant Design Icons',
    sourceUrlPrefix: 'https://icon-sets.iconify.design/ant-design/',
    license: 'MIT'
  }
];

const LOBE_ICON_DIR = new URL('../node_modules/@lobehub/icons-static-svg/icons/', import.meta.url);

function toSvg(path, color) {
  return `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#${color}" d="${path}"/></svg>`;
}

function toIconifySvg(body, color, width = 24, height = 24) {
  const coloredBody = String(body).replace(/currentColor/g, `#${color}`);
  return `<svg role="img" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${coloredBody}</svg>`;
}

function toIconifyRawSvg(body, width = 24, height = 24) {
  return `<svg role="img" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function withSvgRole(svg) {
  const value = String(svg || '').trim();
  if (!value.startsWith('<svg')) return value;
  if (/\srole=/.test(value.match(/^<svg\b[^>]*>/)?.[0] || '')) return value;
  return value.replace(/^<svg\b/, '<svg role="img"');
}

function titleFromSlug(slug) {
  return String(slug)
    .replace(/-(icon|logo)$/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map(part => {
      if (/^(api|cdn|dns|ftp|http|https|id|ip|js|json|pdf|rss|sdk|sql|svg|ui|ux)$/i.test(part)) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function extendedIconifyCollectionToIcons(collection) {
  return Object.entries(collection.icons.icons || {})
    .filter(([, icon]) => icon?.body)
    .map(([slug, icon]) => ({
      slug,
      title: titleFromSlug(slug),
      color: 'currentColor',
      source: collection.source,
      sourceLabel: collection.sourceLabel,
      sourceUrl: `${collection.sourceUrlPrefix}${encodeURIComponent(slug)}/`,
      license: collection.license,
      svg: toIconifyRawSvg(
        icon.body,
        icon.width || collection.icons.width || 24,
        icon.height || collection.icons.height || 24
      )
    }));
}

function lobeBaseSlug(slug) {
  return String(slug || '').replace(/-(brand-color|brand|text-cn|text|color)$/i, '');
}

async function lobeFileToIcon(fileName) {
  if (!fileName.endsWith('.svg')) return null;

  const slug = fileName.replace(/\.svg$/i, '');
  const baseSlug = lobeBaseSlug(slug);
  const svg = await readFile(new URL(fileName, LOBE_ICON_DIR), 'utf8');

  return {
    slug,
    title: titleFromSlug(baseSlug),
    color: 'multi',
    source: 'lobe-icons',
    sourceLabel: 'Lobe Icons',
    sourceUrl: `https://lobehub.com/icons/${encodeURIComponent(baseSlug)}`,
    license: 'MIT',
    svg: withSvgRole(svg)
  };
}

const icons = Object.values(simpleIcons)
  .filter(icon => icon && typeof icon.slug === 'string' && typeof icon.path === 'string')
  .sort((left, right) => left.slug.localeCompare(right.slug))
  .map(icon => ({
    slug: icon.slug,
    title: icon.title,
    color: icon.hex || '111111',
    source: 'simple-icons',
    sourceLabel: 'Simple Icons',
    sourceUrl: icon.source || `https://simpleicons.org/?q=${encodeURIComponent(icon.slug)}`,
    license: 'CC0-1.0',
    svg: toSvg(icon.path, icon.hex || '111111')
  }));

const existingSlugs = new Set(icons.map(icon => icon.slug));
for (const brand of ADDITIONAL_BRANDS) {
  if (existingSlugs.has(brand.slug)) continue;
  const icon = iconifySimpleIcons.icons?.[brand.slug];
  if (!icon?.body) continue;
  icons.push({
    slug: brand.slug,
    title: brand.title,
    color: brand.color,
    source: 'simple-icons',
    sourceLabel: 'Simple Icons',
    sourceUrl: brand.sourceUrl,
    license: 'CC0-1.0',
    svg: toIconifySvg(icon.body, brand.color, icon.width || iconifySimpleIcons.width || 24, icon.height || iconifySimpleIcons.height || 24)
  });
}

icons.sort((left, right) => left.slug.localeCompare(right.slug));

const logoIcons = Object.entries(iconifyLogos.icons || {})
  .filter(([, icon]) => icon?.body)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([slug, icon]) => ({
    slug,
    title: titleFromSlug(slug),
    color: 'multi',
    source: 'iconify-logos',
    sourceLabel: 'Iconify Logos',
    sourceUrl: `https://icon-sets.iconify.design/logos/${encodeURIComponent(slug)}/`,
    license: 'CC0-1.0',
    svg: toIconifyRawSvg(icon.body, icon.width || iconifyLogos.width || 24, icon.height || iconifyLogos.height || 24)
  }));

const iconifyExtendedIcons = EXTENDED_ICONIFY_COLLECTIONS
  .flatMap(extendedIconifyCollectionToIcons);

const lobeIconFiles = (await readdir(LOBE_ICON_DIR))
  .filter(fileName => fileName.endsWith('.svg'));

const lobeIcons = (await Promise.all(lobeIconFiles.map(lobeFileToIcon)))
  .filter(Boolean);

const extendedIcons = [...iconifyExtendedIcons, ...lobeIcons]
  .sort((left, right) => (
    left.source.localeCompare(right.source) ||
    left.slug.localeCompare(right.slug)
  ));

const genericIcons = Object.entries(lucideIcons.icons || {})
  .filter(([, icon]) => icon?.body)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([slug, icon]) => ({
    slug,
    title: titleFromSlug(slug),
    color: 'currentColor',
    source: 'generic-icons',
    sourceLabel: 'Lucide Icons',
    sourceUrl: `https://lucide.dev/icons/${encodeURIComponent(slug)}`,
    license: 'ISC',
    svg: toIconifyRawSvg(icon.body, icon.width || lucideIcons.width || 24, icon.height || lucideIcons.height || 24)
  }));

const simpleOutput = [
  '// Generated by scripts/generate-brand-icons.mjs. Do not edit by hand.',
  `export const SIMPLE_ICONS_VERSION = ${JSON.stringify(simpleIcons.VERSION || 'unknown')};`,
  `export const SIMPLE_ICONS = ${JSON.stringify(icons)};`,
  ''
].join('\n');

const logosOutput = [
  '// Generated by scripts/generate-brand-icons.mjs. Do not edit by hand.',
  `export const LOGO_ICONS_VERSION = ${JSON.stringify('iconify-json/logos')};`,
  `export const LOGO_ICONS = ${JSON.stringify(logoIcons)};`,
  ''
].join('\n');

const extendedOutput = [
  '// Generated by scripts/generate-brand-icons.mjs. Do not edit by hand.',
  `export const EXTENDED_ICONS_VERSION = ${JSON.stringify('iconify-json/ri + iconify-json/ant-design + lobehub/icons-static-svg')};`,
  `export const EXTENDED_ICONS = ${JSON.stringify(extendedIcons)};`,
  ''
].join('\n');

const genericOutput = [
  '// Generated by scripts/generate-brand-icons.mjs. Do not edit by hand.',
  `export const GENERIC_ICONS_VERSION = ${JSON.stringify('iconify-json/lucide')};`,
  `export const GENERIC_ICONS = ${JSON.stringify(genericIcons)};`,
  ''
].join('\n');

await Promise.all([
  writeFile(new URL('../core/icons/generated/simple-icons.generated.js', import.meta.url), simpleOutput, 'utf8'),
  writeFile(new URL('../core/icons/generated/logo-icons.generated.js', import.meta.url), logosOutput, 'utf8'),
  writeFile(new URL('../core/icons/generated/extended-icons.generated.js', import.meta.url), extendedOutput, 'utf8'),
  writeFile(new URL('../core/icons/generated/generic-icons.generated.js', import.meta.url), genericOutput, 'utf8')
]);

console.log(`Generated ${icons.length} Simple Icons entries.`);
console.log(`Generated ${logoIcons.length} Iconify Logos entries.`);
console.log(`Generated ${extendedIcons.length} extended local icon entries.`);
console.log(`Generated ${genericIcons.length} Lucide generic entries.`);
