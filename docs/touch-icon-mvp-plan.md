# MarkPad Touch And Icon Studio MVP Plan

## Direction

MarkPad 的产品定位是：

> 面向远程平板触控操作的新标签页书签面板，优先保证手指低精度输入、快速打开、批量管理和统一 SVG 图标视觉。

用户可见产品名已统一为 MarkPad，包括 `manifest.json`、README 标题、`index.html` title 和图标导出页。仓库目录和内部 `Bookmark*` 类名仍保留，用于描述书签领域对象；除非另有明确迁移需求，不做全量文件/类名重命名。

生图效果未达到预期，当前方向明确移除模型 API 集成，只保留 SVG 搜索、预览和应用。这样可以降低复杂度、避免 API key 管理和生成结果不可控的问题，也更符合触控场景下的快速选择需求。

当前主界面视觉参考 `XGWNJE/visual-rules-collection` 的 Lumen Index 规范统一既有界面风格：温白/深灰背景、黑白骨架、轻边框、胶囊按钮和低阴影。后续触控与图标工坊改动应继续使用 `css/modules/variables.css` 中的 Lumen 风格 token；除非另有明确需求，不应新增信息架构、品牌块、底部栏或装饰性视觉内容。

应用自身图标已统一到 `core/IconLibrary.js` 的本地线性 SVG 图标库。书签默认图标由 `core/icons/IconResolver.js` 解析：优先用户自定义图标，其次本地品牌图标库，再次是通用工具/信息图标库，未命中时使用首字母兜底。默认匹配不准时，用户可以打开本地图标候选列表查看匹配信息并手动应用。

## Product Principles

- 触控优先：主要操作要能用手指完成，不依赖 hover、右键或精细拖拽。
- 用户审美优先：默认匹配只做保守命中，最终图标选择可由用户通过本地候选、SVG 搜索或位图上传确认。
- 无模型 API：不接入 DeepSeek、Grsai 或其他生图模型。
- SVG 优先：不用 AI 也能完整搜索、预览并应用 SVG 图标。
- 默认高清：成熟品牌和产品优先使用本地品牌图标库，品牌来源包含 Simple Icons、Iconify Logos、Remix、Ant Design 和 Lobe Icons；非品牌工具和信息场景使用 Lucide 通用图标，避免低清 favicon 作为默认展示。
- 可替换外部源：图标查询通过 provider adapter 封装。MVP 优先尝试 iconfont 实时查询，同时按比例混排 Iconify 和 SVG API；每个候选必须显式标注来源，避免用户误以为全是 iconfont。

## Touch UX Target

触控优化分阶段做，不阻塞图标 MVP：

- 卡片默认触控尺寸更大，`pointer: coarse` 下自动进入触控密度。
- 主要操作当前集中到顶部工具栏和工具菜单：新建、搜索、面包屑、跳转方式、卡片文字和壁纸偏好。
- 长按卡片打开与右键一致的操作菜单，避免触控用户依赖鼠标右键。
- 删除继续沿用统一确认弹窗，文件夹删除显示包含子项数量。
- 精细拖拽排序保留给鼠标模式；落下后先做本地换位动画再同步 Chrome 书签，触控排序后续单独设计。

## Icon Studio Flow

图标工坊提供本地候选和外部 SVG 搜索两个入口。

### Local Library Candidate Flow

1. 用户右键/长按书签，进入 `图标：匹配本地图标`。
2. 系统基于标题、URL、完整域名、主域名、域名片段和路径片段生成本地图标候选，候选来源包含 Simple Icons、Iconify Logos、Remix、Ant Design、Lobe Icons 和 Lucide。
3. 弹窗展示“匹配信息”，包括用于匹配的标题、URL（不含 query/hash）、完整域名、主域名、标题词、域名片段、路径片段和实际查询词。
4. 每个候选展示本地图标、品牌名、slug、来源和命中依据，例如 `标题词:openai（精确匹配）`。
5. 用户可输入额外关键词继续筛选本地图标库。
6. 用户点击 `应用本地图标`，清理 SVG 后写入当前书签自定义图标。

### External SVG Search Flow

1. 用户右键/长按书签，进入 `图标：搜索 SVG`。
2. 搜索框默认填入域名关键词，例如 `chatgpt.com` 默认 `chatgpt`。
3. 用户可直接调整关键词。
4. 系统实时查询 SVG 候选；优先走 iconfont provider，并按比例混排 Iconify / SVG API 候选。
5. 展示 SVG 候选列表，并在候选卡片上标注来源。
6. 用户选择一个 SVG。
7. 预览当前卡片效果。
8. 用户点击 `直接应用 SVG`，写入当前书签自定义图标。

整个流程不调用模型 API，不保存 API key，不提供生图入口。

## Default Icon Resolution

默认书签图标不再依赖网站 favicon。展示顺序固定为：

1. 用户自定义图标。
2. `resolved_icon_cache_v1` 中的自动解析缓存。
3. 本地品牌图标库：Simple Icons 优先，Iconify Logos、Remix、Ant Design 和 Lobe Icons 作为品牌补充；扩展库全量可用于手动候选，自动匹配只开放明确品牌白名单。
4. Lucide 通用工具/信息图标库。
5. 首字母兜底。

本地图标库由生成脚本写入 `core/icons/generated/`：

- `simple-icons.generated.js`：来自 `simple-icons` 和少量 `@iconify-json/simple-icons` 补充。
- `logo-icons.generated.js`：来自 `@iconify-json/logos`，补充更多品牌和产品 logo。
- `extended-icons.generated.js`：来自 `@iconify-json/ri`、`@iconify-json/ant-design` 和 `@lobehub/icons-static-svg`，补充国内品牌、AI 产品和通用候选图标；文件体积必须保持在 100MB 以内。
- `generic-icons.generated.js`：来自 `@iconify-json/lucide`，覆盖数据库、文档、API、服务、终端、日历、搜索、图表、上传下载等通用工具/信息场景。

运行时直接读取生成文件，不请求网络；生成文件不要手改，更新数据时运行 `npm run generate:icons`。

自动匹配顺序需要照顾非标准地址，但必须保持保守：先用用户标题的完整品牌/产品短语做精确匹配，例如 `Google Search Console`；再用域名主段匹配；最后用标题 token 匹配大厂或产品名，例如内网工具标题里出现 `OpenAI` 时可命中 OpenAI 图标。

品牌未命中后，自动匹配才进入通用 Lucide 回落，只处理明确的工具/信息词，例如 `database`、`docs`、`api`、`server`、`calendar`、`terminal`、`chart`、`mail`、`security` 等，避免通用图标抢走明确品牌命中。

本地图标候选列表可以更宽松。它会把标题词、域名片段、路径片段和用户追加关键词全部作为候选查询，并混合展示品牌和通用候选，把每个候选的命中字段展示给用户。候选列表只用于手动应用，不改变默认自动匹配的品牌优先策略。

位图高清定义只用于用户上传：原始解码宽高都必须不低于 256px。SVG 图标不按像素尺寸判断，主要通过来源质量、清理规则和统一渲染尺寸控制。

## Icon Source Provider

图标工坊的手动 SVG 搜索不做本地 iconfont 库。外部候选来源通过 `IconSourceProvider` 抽象：

```js
class IconSourceProvider {
  async search(query, options) {}
  async getSvg(iconId) {}
}
```

首个 provider 目标是 iconfont 实时查询。MVP 实测发现 iconfont 网页搜索和 `/api/icon/search.json` 入口返回 SPA HTML，`/api/search/icon.json` 未登录会返回 `LOGIN REQUIRED`；因此 `IconSourceProvider` 保留 iconfont 登录态适配边界。当 API 不返回可用 SVG 时，系统会自动后台打开或复用与当前关键词匹配的 iconfont 搜索页，并从 `.block-icon-list li svg.icon` 抽取 SVG；不得读取不匹配关键词的旧 iconfont 页面。`IconStudio` 的 iconfont 按钮只用于首次登录或人工查看结果。当 iconfont 仍不可用时，继续混排 Iconify 与 SVG API，确保用户仍能完成 SVG 搜索、候选展示和直接应用。

候选项结构：

```json
{
  "id": "iconify:material-symbols:home",
  "name": "robot",
  "source": "iconify",
  "sourceLabel": "Iconify · Material Symbols",
  "sourceUrl": "https://icon-sets.iconify.design/material-symbols/home/",
  "license": "unknown",
  "svg": "<svg ...></svg>"
}
```

## Storage

自定义图标继续沿用 `BookmarkStore.setCustomIcon(bookmarkId, iconData)` 写入，并始终高于默认图标解析结果。当前支持三种用户自定义来源：

- 本地图标候选：从生成后的 Simple Icons、Iconify Logos、Remix、Ant Design、Lobe Icons 或 Lucide 数据中选择 SVG，保存前通过 `IconSanitizer` 清理。
- SVG 搜索：图标工坊候选在保存前通过 `IconSanitizer` 清理。
- 位图上传：图片解码后原始宽高都必须不低于 256px，保存为 data URL。

自动解析出的默认图标写入 `resolved_icon_cache_v1`，与 `custom_icon_cache` 分离。重新匹配默认图标只清除解析缓存，不删除用户自定义图标。

自定义图标元数据后续如需增强，可考虑保存：

```json
{
  "bookmarkId": "123",
  "type": "svg",
  "source": "iconify",
  "sourceIconId": "iconify:material-symbols:home",
  "sourceUrl": "https://icon-sets.iconify.design/material-symbols/home/",
  "svg": "<svg ...></svg>",
  "createdAt": "2026-05-27T00:00:00.000Z"
}
```

## MVP Scope

第一版只跑通单个书签闭环：

1. 新增 `IconStudio` 弹窗/底部抽屉。
2. 卡片右键菜单增加 `图标：匹配本地图标` 和 `图标：搜索 SVG`。
3. 新增 `IconSourceProvider`，保留 iconfont 实时搜索适配边界，并按比例混排 Iconify / SVG API 候选。
4. 搜索模式：默认域名关键词，用户可调整关键词，查询 SVG，选择后直接应用。
5. 默认图标使用本地品牌图标库保守匹配，品牌未命中后用 Lucide 通用图标回落，再未命中用首字母兜底；不准或未命中时，用户可打开本地图标候选并手动应用；不再把 favicon fallback 作为默认路径。

MVP 不做：

- 项目文件和类名的全量品牌重命名
- 模型 API 接入
- AI 生图或高清生成
- API key 配置
- 批量生成
- 同域名批量应用
- 图标历史版本管理
- 远程批量抓取或 AI 自动为所有书签生成图标
- 独立底部操作栏改造；当前主控区保持在头部工具栏和工具菜单

## Acceptance Criteria

- 不配置任何 API key，也能完成本地图标候选、SVG 搜索、候选展示、预览和直接应用。
- 图标工坊 UI 中没有 API 配置、模型选择、生图模式或高清生成按钮。
- iconfont、Iconify、SVG API 候选来源显式可见。
- 已知品牌书签无需网络即可匹配本地品牌图标库；非品牌工具/信息类书签可回落到 Lucide 通用图标；未匹配书签显示首字母兜底，并能通过本地图标候选展示可利用的标题、域名和路径匹配信息。
- 用户自定义 SVG 或合格位图始终覆盖默认图标；小于 256×256 的位图上传会被拒绝。
- `manifest.json` 不包含 DeepSeek、Grsai 等模型 API host permission。
- 主要 JS 文件通过 `node --check`。
- 在 `chrome://extensions/` 刷新扩展后，MVP 主流程通过手动验证。
- 用户可见产品名显示为 MarkPad；内部 `Bookmark*` 文件名只作为领域命名保留。
- 项目不维护独立自动评测脚本；MVP 验收以语法检查、扩展加载检查和人工流程验证为准。

## Verification Checklist

实现 MVP 后至少检查：

- `node --check` 覆盖所有改动过的 JS 文件。
- `node --test tests\icon-sanitizer.test.mjs tests\icon-storage.test.mjs tests\icon-library-provider.test.mjs tests\icon-resolver.test.mjs tests\icon-component-integration.test.mjs tests\bitmap-icon-upload.test.mjs` 通过。
- `manifest.json` 是合法 JSON，`permissions` 与 `host_permissions` 只覆盖实际使用的 Chrome API 和 SVG 图标源。
- 不配置 API key 时，SVG 搜索、候选展示、直接应用可用。
- 图标库命中、本地图标候选、首字母兜底、自定义 SVG、自定义位图上传失败/成功路径都有测试或手动验证覆盖。
- Chrome 扩展刷新后，图标工坊弹窗、本地图标候选入口、卡片右键入口和现有书签打开流程不冲突。

## Implementation Order

1. 默认图标架构：创建 `IconResolver`、`IconLibraryProvider`、`IconSanitizer`、`BitmapIconProcessor` 和分层缓存。
2. 本地图标数据：用 Simple Icons、Iconify Logos、Remix、Ant Design 和 Lobe Icons 生成品牌/候选图标库，用 Lucide 生成通用图标库，测试域名匹配、标题匹配、通用回落、可解释候选和模糊搜索。
3. SVG 搜索模式：保留无 AI 的 SVG 搜索、候选展示、SVG 应用；iconfont 不稳定时按比例混排 Iconify / SVG API，并显式标注来源。
4. 上传模式：位图上传前校验原始尺寸，拒绝低于 256×256 的图片。
5. 触控优化：让图标工坊、菜单和卡片操作在粗指针下保持可点击尺寸与稳定布局。
6. 复盘后再决定是否做批量、同域名应用和图标历史。
