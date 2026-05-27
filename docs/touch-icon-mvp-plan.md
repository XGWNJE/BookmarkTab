# MarkPad Touch And Icon Studio MVP Plan

## Direction

MarkPad 的产品定位是：

> 面向远程平板触控操作的新标签页书签面板，优先保证手指低精度输入、快速打开、批量管理和统一高清图标视觉。

当前代码仍保留 `BookmarkTab` 文件名、扩展名和部分历史结构。MVP 阶段先不做全量重命名，先以 MarkPad 的产品方向实现图标工坊闭环；后续再按品牌视觉规范统一 `manifest.json`、README 标题、`index.html` title 和扩展图标。

当前卡片式布局适合触控，但现有交互仍偏鼠标/键盘。MVP 目标是先跑通触控友好的图标选择闭环，再逐步替换 hover、右键和精细拖拽依赖。

## Product Principles

- 触控优先：主要操作要能用手指完成，不依赖 hover、右键或精细拖拽。
- 用户审美优先：AI 只能辅助搜索和美化，最终图标选择由用户确认。
- AI 可选：不用 AI 时也能完整选择并应用 SVG 图标。
- 付费 API 显式触发：DeepSeek 和 Grsai 只在用户点击对应能力时调用。
- 密钥本地配置：用户自己填写 API key，保存到 `chrome.storage.local`，不写入仓库、日志或文档示例。
- 可替换外部源：iconfont 查询通过 provider adapter 封装，避免项目绑定某个不稳定网页接口。

## Touch UX Target

触控优化分阶段做，不阻塞图标 MVP：

- 卡片默认触控尺寸更大，`pointer: coarse` 下自动进入触控密度。
- 主要操作逐步下移到底部操作栏：返回、搜索、新建、选择模式、设置。
- 长按卡片进入选择模式，选择模式内提供移动、删除、改图标、取消。
- 删除继续沿用统一确认弹窗，文件夹删除显示包含子项数量。
- 精细拖拽排序保留给鼠标模式；触控排序后续单独设计。

## Icon Studio Modes

图标工坊提供两种入口。

### Manual SVG Mode

不用 AI，默认低成本路径。

1. 用户右键/长按书签，进入 `选择 SVG 图标`。
2. 显示搜索框。
3. 用户输入关键词。
4. 系统实时查询 iconfont SVG 候选。
5. 展示 SVG 候选列表。
6. 用户选择一个 SVG。
7. 预览当前卡片效果。
8. 用户确认后直接保存为自定义图标。

这条路径不调用 DeepSeek、不调用 Grsai。

### AI Recommendation Mode

用户选择 AI 能力时，搜索词交给 DeepSeek。

1. 用户进入 `AI 推荐 SVG 图标`。
2. 系统读取书签 `title`、`url`、`hostname`。
3. DeepSeek 默认使用 `deepseek-v4-flash` 生成结构化搜索建议。
4. 系统用 DeepSeek 返回的 query 列表实时查询 iconfont。
5. 展示 SVG 候选列表。
6. 用户选择一个 SVG。
7. 用户选择 `直接应用 SVG` 或 `用 Grsai 高清美化`。

AI 模式不默认展示搜索框。搜索词可折叠展示，并提供 `换一批` 和 `改为手动搜索`。

## AI Contracts

### DeepSeek Semantic Contract

默认配置：

- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-flash`
- Output: strict JSON

输入：

```json
{
  "title": "ChatGPT",
  "url": "https://chatgpt.com/",
  "hostname": "chatgpt.com"
}
```

输出：

```json
{
  "category": "ai_assistant",
  "preferredQuery": "ai chat",
  "searchQueries": ["ai chat", "assistant", "sparkle", "robot"],
  "recommendedColors": ["#10a37f", "#111827"],
  "style": "simple, touch-friendly, rounded, high contrast",
  "reason": "This bookmark is an AI assistant/chat product."
}
```

前端按 `preferredQuery` 优先搜索；结果不足时依次使用 `searchQueries`。

### Grsai Image Contract

Grsai 只在用户已选择 SVG 且点击高清生成时调用。

默认配置：

- Endpoint: `https://grsaiapi.com` 或 `https://grsai.dakka.com.cn`
- API: `POST /v1/api/generate`
- Model: `gpt-image-2`
- Size: `1024x1024`
- `replyType`: `json`

请求示例：

```json
{
  "model": "gpt-image-2",
  "prompt": "Create a high-resolution touch-friendly bookmark app icon based on the provided SVG reference shape. Use the SVG as composition guidance only. No text, no logo, no watermark.",
  "images": ["data:image/png;base64,..."],
  "aspectRatio": "1024x1024",
  "replyType": "json"
}
```

如果同步请求超时，后续再支持 `replyType: async` 并轮询 `GET /v1/api/result?id=...`。

## Icon Source Provider

MVP 不做本地 iconfont 库。图标来源通过 `IconSourceProvider` 抽象：

```js
class IconSourceProvider {
  async search(query, options) {}
  async getSvg(iconId) {}
}
```

首个 provider 目标是 iconfont 实时查询。由于 iconfont 是否存在稳定公开搜索 API 需要实测，MVP 实现时要把查询、解析、CORS 和授权信息隔离在 provider 内。

候选项结构：

```json
{
  "id": "iconfont:xxx",
  "name": "robot",
  "source": "iconfont",
  "sourceUrl": "https://www.iconfont.cn/...",
  "license": "unknown",
  "svg": "<svg ...></svg>"
}
```

## Storage

API 配置保存到 `chrome.storage.local`：

```json
{
  "deepseek": {
    "baseUrl": "https://api.deepseek.com",
    "model": "deepseek-v4-flash"
  },
  "grsai": {
    "endpoint": "https://grsaiapi.com",
    "model": "gpt-image-2",
    "size": "1024x1024"
  }
}
```

API key 单独保存，不出现在导出文档、日志或错误提示中。

自定义图标元数据建议保存：

```json
{
  "bookmarkId": "123",
  "type": "svg",
  "source": "iconfont",
  "sourceIconId": "iconfont:xxx",
  "sourceUrl": "https://www.iconfont.cn/...",
  "svg": "<svg ...></svg>",
  "semanticProvider": null,
  "imageProvider": null,
  "createdAt": "2026-05-27T00:00:00.000Z"
}
```

经过 Grsai 生成后，`type` 为 `ai-image`，并额外保存 `generatedImage`、`semanticModel`、`imageModel` 和原始 SVG 来源。

## MVP Scope

第一版只跑通单个书签闭环：

1. 新增 `IconStudio` 弹窗/底部抽屉。
2. 卡片右键菜单增加 `选择 SVG 图标` 和 `AI 推荐 SVG 图标`。
3. 新增 `AiConfigStore`，保存 DeepSeek / Grsai 配置和 key。
4. 新增 `IconSourceProvider`，先接 iconfont 实时搜索。
5. 手动模式：用户输入关键词，查询 SVG，选择后直接应用。
6. AI 模式：DeepSeek 生成搜索词，查询 SVG，用户选择后直接应用。
7. Grsai 模式：用户选择 SVG 后生成 1 张高清图，确认后应用。
8. 保持现有上传自定义图标、恢复默认图标、favicon fallback 不变。

MVP 不做：

- 项目文件、类名和扩展清单的全量品牌重命名
- 批量生成
- 同域名批量应用
- 图标历史版本管理
- 本地图标库
- 自动为所有书签生成图标
- 触控底部操作栏完整改造

## Acceptance Criteria

- 不配置 API key 时，手动 SVG 模式仍能完整工作。
- 配置 DeepSeek key 后，AI 模式能返回 JSON 搜索建议，并展示 SVG 候选。
- 配置 Grsai key 后，用户选择 SVG 后能生成 1 张高清图标并应用。
- 所有付费 API 调用都由用户点击触发。
- API key 不出现在 console、错误弹窗、文档示例和 git diff 中。
- 主要 JS 文件通过 `node --check`。
- 在 `chrome://extensions/` 刷新扩展后，MVP 主流程通过手动验证。
- 项目不维护独立自动评测脚本；MVP 验收以语法检查、扩展加载检查和人工流程验证为准。

## Verification Checklist

实现 MVP 后至少检查：

- `node --check` 覆盖所有改动过的 JS 文件。
- `manifest.json` 是合法 JSON，`permissions` 与 `host_permissions` 覆盖 DeepSeek、Grsai 和图标源。
- 不配置 API key 时，手动 SVG 搜索、候选展示、直接应用可用。
- 配置 DeepSeek key 后，AI 推荐能返回结构化搜索词，且失败时不影响手动模式。
- 配置 Grsai key 后，高清生成能返回图片并在用户确认后应用。
- 所有 API 错误都脱敏，不显示完整 key、Authorization header 或原始敏感请求。
- Chrome 扩展刷新后，图标工坊弹窗、卡片右键入口和现有书签打开流程不冲突。

## Implementation Order

1. 架构占位：创建 `IconStudio`、`AiConfigStore`、`IconSourceProvider`、`IconGenerationService` 空骨架。
2. 手动 SVG 模式：先跑通无 AI 的 iconfont 搜索、候选展示、SVG 应用。
3. DeepSeek 模式：接入 `deepseek-v4-flash`，只生成搜索词并复用 SVG 候选 UI。
4. Grsai 模式：把选中 SVG 渲染成 PNG/base64，调用 Grsai 生成高清图。
5. 触控优化：把图标工坊和选择模式做成大按钮、底部抽屉、粗指针友好布局。
6. 复盘后再决定是否做批量、同域名应用和图标历史。
