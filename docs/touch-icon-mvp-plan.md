# MarkPad Touch And Icon Studio MVP Plan

## Direction

MarkPad 的产品定位是：

> 面向远程平板触控操作的新标签页书签面板，优先保证手指低精度输入、快速打开、批量管理和统一 SVG 图标视觉。

当前代码仍保留 `BookmarkTab` 文件名、扩展名和部分历史结构。MVP 阶段先不做全量重命名，先以 MarkPad 的产品方向实现图标工坊闭环；后续再按品牌视觉规范统一 `manifest.json`、README 标题、`index.html` title 和扩展图标。

生图效果未达到预期，当前方向明确移除模型 API 集成，只保留 SVG 搜索、预览和应用。这样可以降低复杂度、避免 API key 管理和生成结果不可控的问题，也更符合触控场景下的快速选择需求。

## Product Principles

- 触控优先：主要操作要能用手指完成，不依赖 hover、右键或精细拖拽。
- 用户审美优先：最终图标选择由用户确认。
- 无模型 API：不接入 DeepSeek、Grsai 或其他生图模型。
- SVG 优先：不用 AI 也能完整搜索、预览并应用 SVG 图标。
- 可替换外部源：图标查询通过 provider adapter 封装。MVP 优先尝试 iconfont 实时查询，同时按比例混排 Iconify 和 SVG API；每个候选必须显式标注来源，避免用户误以为全是 iconfont。

## Touch UX Target

触控优化分阶段做，不阻塞图标 MVP：

- 卡片默认触控尺寸更大，`pointer: coarse` 下自动进入触控密度。
- 主要操作逐步下移到底部操作栏：返回、搜索、新建、选择模式、设置。
- 长按卡片进入选择模式，选择模式内提供移动、删除、改图标、取消。
- 删除继续沿用统一确认弹窗，文件夹删除显示包含子项数量。
- 精细拖拽排序保留给鼠标模式；落下后先做本地换位动画再同步 Chrome 书签，触控排序后续单独设计。

## Icon Studio Flow

图标工坊提供一个统一入口。

1. 用户右键/长按书签，进入 `选择 SVG 图标`。
2. 搜索框默认填入域名关键词，例如 `chatgpt.com` 默认 `chatgpt`。
3. 用户可直接调整关键词。
4. 系统实时查询 SVG 候选；优先走 iconfont provider，并按比例混排 Iconify / SVG API 候选。
5. 展示 SVG 候选列表，并在候选卡片上标注来源。
6. 用户选择一个 SVG。
7. 预览当前卡片效果。
8. 用户点击 `直接应用 SVG`，写入当前书签自定义图标。

整个流程不调用模型 API，不保存 API key，不提供生图入口。

## Icon Source Provider

MVP 不做本地 iconfont 库。图标来源通过 `IconSourceProvider` 抽象：

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

自定义图标继续沿用 `BookmarkStore.setCustomIcon(bookmarkId, iconData)` 写入。当前 MVP 只保存清理后的 SVG 字符串，不新增 AI 生成图、语义信息或模型元数据。

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
2. 卡片右键菜单增加 `选择 SVG 图标`。
3. 新增 `IconSourceProvider`，保留 iconfont 实时搜索适配边界，并按比例混排 Iconify / SVG API 候选。
4. 搜索模式：默认域名关键词，用户可调整关键词，查询 SVG，选择后直接应用。
5. 保持现有上传自定义图标、恢复默认图标、favicon fallback 不变。

MVP 不做：

- 项目文件、类名和扩展清单的全量品牌重命名
- 模型 API 接入
- 生图或高清生成
- API key 配置
- 批量生成
- 同域名批量应用
- 图标历史版本管理
- 本地图标库
- 自动为所有书签生成图标
- 触控底部操作栏完整改造

## Acceptance Criteria

- 不配置任何 API key，也能完成 SVG 搜索、候选展示、预览和直接应用。
- 图标工坊 UI 中没有 API 配置、模型选择、生图模式或高清生成按钮。
- iconfont、Iconify、SVG API 候选来源显式可见。
- `manifest.json` 不包含 DeepSeek、Grsai 等模型 API host permission。
- 主要 JS 文件通过 `node --check`。
- 在 `chrome://extensions/` 刷新扩展后，MVP 主流程通过手动验证。
- 项目不维护独立自动评测脚本；MVP 验收以语法检查、扩展加载检查和人工流程验证为准。

## Verification Checklist

实现 MVP 后至少检查：

- `node --check` 覆盖所有改动过的 JS 文件。
- `manifest.json` 是合法 JSON，`permissions` 与 `host_permissions` 只覆盖实际使用的 Chrome API 和 SVG 图标源。
- 不配置 API key 时，SVG 搜索、候选展示、直接应用可用。
- Chrome 扩展刷新后，图标工坊弹窗、卡片右键入口和现有书签打开流程不冲突。

## Implementation Order

1. 架构占位：创建 `IconStudio`、`IconSourceProvider`。
2. SVG 搜索模式：先跑通无 AI 的 SVG 搜索、候选展示、SVG 应用；iconfont 不稳定时按比例混排 Iconify / SVG API，并显式标注来源。
3. 触控优化：把图标工坊和选择模式做成大按钮、底部抽屉、粗指针友好布局。
4. 复盘后再决定是否做批量、同域名应用和图标历史。
