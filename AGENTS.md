# AGENTS.md

本文档为 Codex 提供本仓库的代码协作指引。

## Verification

项目不维护独立自动评测脚本。代码修改后优先运行与改动范围匹配的轻量检查：

- JavaScript 语法检查：`node --check <file>`
- Chrome 扩展清单检查：确认 `manifest.json` JSON 合法且权限与实际功能匹配
- 文档变更：确认 README、AGENTS 和 `docs/` 中没有过时路径或未实现承诺

涉及触控交互、弹窗、拖拽、图标工坊或 Chrome API 行为时，需要在 Chrome 扩展页面刷新后做手动验证。

## 项目概述

BookmarkTab 是一款 Chrome 扩展（Manifest V3），将新标签页替换为触控友好的卡片式书签管理器。当前方向面向远程平板触控 PC 的使用场景，采用玻璃拟态设计，自动适配系统深浅色模式，并直接读写 Chrome 原生书签数据。

下一阶段产品计划见 `docs/touch-icon-mvp-plan.md`：先跑通图标工坊 MVP，再逐步推进触控优先交互。品牌视觉规范见 `docs/markpad-brand-visual-guide.md`，后续 UI 和命名调整优先遵守该文档。

## 架构

```
BookmarkTab/
├── components/     # UI 组件
├── core/           # 数据层与系统基础设施
├── css/            # 样式：main.css 入口 + modules/ 模块
│   └── modules/    # 按功能划分的 CSS 模块
├── docs/           # 产品方向、MVP 计划与后续设计文档
├── icons/          # 扩展图标 + export.html（图标导出工具）
├── wallpapers/     # 历史壁纸资源；当前壁纸设置使用 SettingsPanel 内置预设
├── main.js         # 应用入口
└── manifest.json   # Chrome 扩展清单 V3
```

### 核心层（./core/）

- **BookmarkStore.js** — 数据层，封装 `chrome.bookmarks` API。负责增删改查、favicon 缓存、自定义图标存储、书签树查询、文件夹子项数量统计。图标缓存优先写入 `chrome.storage.local`，同时兼容旧 `localStorage` 数据。所有书签操作均通过此单例完成。
- **IconSourceProvider.js** — 外部 SVG 图标源适配层。MVP 按比例混排 iconfont、Iconify 和 SVG API：优先尝试 iconfont 实时查询；当 iconfont API 不返回可用 SVG 时，会自动后台打开/复用与当前关键词匹配的 iconfont 搜索页，并从 `.block-icon-list li svg.icon` 抽取 SVG。不得读取不匹配关键词的旧 iconfont 页面。`IconStudio` 的 iconfont 按钮只用于首次登录或人工查看结果；图标工坊关闭时需要关闭由本流程自动打开的 iconfont 标签页。
- **Router.js** — 导航层，管理文件夹层级与浏览器历史集成。维护文件夹路径栈，通过 EventBus 发射 `navigate` 事件。
- **EventBus.js** — 发布/订阅事件系统，解耦各组件。广泛用于跨组件通信（如 `navigate`、`card:dragstart`、`toolbar:newBookmark`）。

### 组件层（./components/）

组件间松耦合，通过 EventBus 事件通信。每个组件通常：
- 在构造函数中订阅相关事件
- 渲染 UI 并绑定 DOM 事件监听器
- 状态变更时发射事件

关键组件：
- **BookmarkGrid.js** — 网格容器，渲染当前文件夹的书签卡片。负责 favicon 分批懒加载、卡片多选、拖拽排序、删除执行和刷新协调。拖拽排序落下时会先做本地 DOM 换位和 FLIP 动画，再同步 Chrome 书签，避免等待整页刷新造成卡顿。文件夹子项数量通过 `BookmarkStore.getFolderChildCountMap()` 批量统计，避免逐卡片请求。
- **BookmarkCard.js** — 单张书签/文件夹卡片。支持拖拽、右键菜单、行内标题编辑、自定义图标、Toast 提示。
- **Breadcrumb.js** — 面包屑导航栏。
- **EditDialog.js** — 新建/编辑书签或文件夹弹窗。
- **IconStudio.js** — 图标工坊弹窗/抽屉。支持统一 SVG 搜索、SVG 预览与直接应用，不接入模型 API 或生图功能。
- **MoveDialog.js** — 右键菜单“移动到...”的目标文件夹选择弹窗。
- **QuickFind.js** — 全局模糊搜索浮层（`/` 或 `Ctrl+F`）。书签结果按当前跳转方式打开，文件夹结果进入对应文件夹。
- **Toolbar.js** — 顶部工具栏，自动隐藏行为。
- **SettingsPanel.js** — 左下角设置菜单中的壁纸偏好模块，仅保留浅色、暗色和自定义图片；自定义图片会压缩到本地存储可接受大小并反馈结果，支持填充、完整、拉伸、居中、平铺和背景模糊度调节，选择保存到 `localStorage`。

### CSS（./css/）

模块化 CSS 架构，使用 CSS 自定义属性。`main.css` 引入所有模块。

关键模块：
- `variables.css` — 设计令牌（颜色、间距、圆角、过渡），通过 `prefers-color-scheme` 适配深浅色模式。
- `card.css` — 书签卡片样式、右键菜单、放置指示器、Toast 动画。
- `grid.css` — 网格布局与空状态。
- `drag-zones.css` — 边缘拖拽区域（左侧：移动面板，右侧：删除区域）。
- `dialog.css` — 弹窗/模态框基础样式。
- `toolbar.css` — 工具栏与菜单触发按钮样式。
- `breadcrumb.css` — 面包屑导航。
- `quick-find.css` — 搜索浮层。
- `icon-studio.css` — 图标工坊弹窗、候选 SVG 网格、预览区和触控粗指针布局。
- `animations.css` — 卡片入场/悬停动画。
- `shortcuts.css` — 快捷键提示弹窗。
- `settings.css` / `wallpapers.css` — 左下角设置菜单中的壁纸网格，以及页面背景层样式。
- `base.css` — 全局基础样式。

## 关键模式

**事件驱动通信**：组件间不直接调用。`BookmarkGrid` 监听 Router 的 `navigate`，`Toolbar` 发射 `toolbar:newBookmark` 由 `EditDialog` 捕获，以此类推。

**Favicon / 自定义图标缓存**：`BookmarkStore` 按域名提取并缓存 favicon。主源使用 `chrome-extension://.../_favicon/` API，失败时回退到 Google Favicon API。失败的查找会被标记，防止重复请求风暴。缓存优先使用 `chrome.storage.local`，并保留旧 `localStorage` 读取/写入兼容；`clearFavicon()` 支持右键菜单手动刷新。

**拖拽区域**：主内容区两侧有不可见的边缘触发区（各占视口宽度的 12%）。左侧显示文件夹树面板作为移动目标，右侧显示删除确认。

**删除确认**：删除统一通过 `card:requestDelete` 进入 `main.js` 的确认弹窗，再由确认按钮发射 `card:delete` 执行删除。文件夹删除会通过 `BookmarkStore.getNode()` + `countDescendants()` 显示包含子项数量，避免键盘删除绕过确认。

**SVG 安全过滤**：自定义图标（SVG）在存储前通过 `DOMParser` 清理。当前会移除可执行/嵌入/外链相关元素（如 `script`、`iframe`、`foreignObject`、`object`、`embed`、`link`、`style`、`image`、`use`），并过滤 `on*` 事件属性、`javascript:`、`data:`、`xlink:href` 外部引用和 `style url(...)` 等风险。

**Toast 提示**：`BookmarkCard._showToast()` 在底部居中显示临时反馈，用于验证错误（如图标过大、SVG 不安全）。使用单例样式块管理入场动画。

**图标上传校验**：自定义图标强制执行文件大小（1 KB – 1 MB）、图片尺寸（最小 32×32）和 SVG 安全检查。校验失败时显示 Toast，而非静默拒绝。

**应用级职责**（`main.js`）：启动前初始化 `BookmarkStore.initStorage()`，装配组件，全局快捷键，卡片尺寸持久化（`localStorage`），拖拽区域协调，删除确认弹窗，菜单面板（跳转方式 + 卡片文字显隐切换 + 壁纸偏好），多选状态管理。

**QuickFind 导航**：搜索结果中的书签按 `openMode` 使用 `chrome.tabs.create()` 或 `chrome.tabs.update()`；文件夹结果使用 `Router.push(id, title)` 进入文件夹。

**图标工坊 MVP**：当前通过 `IconStudio` 接入右键菜单，并支持触控/手写笔长按卡片打开同一菜单。图标搜索是统一流程：默认关键词来自域名，用户可直接调整。`IconSourceProvider` 按比例混排 iconfont、Iconify 和 SVG API，并在候选卡片与状态栏显式标注来源。当前已移除模型 API 集成和生图功能，只保留 SVG 搜索、预览和直接应用。

## 开发指南

**加载扩展：**
1. 打开 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择项目根目录
4. 打开新标签页即可使用

**代码修改后：** 在 `chrome://extensions/` 点击扩展卡片上的刷新按钮。

**无构建步骤** — 纯 ES Modules，直接从源码加载。

**无第三方依赖** — 原生 JavaScript（ES2020+）、CSS3、Chrome Extensions Manifest V3。
