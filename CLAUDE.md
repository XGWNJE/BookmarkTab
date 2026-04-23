# CLAUDE.md

本文档为 Claude Code 提供本仓库的代码协作指引。

## 项目概述

BookmarkTab 是一款 Chrome 扩展（Manifest V3），将新标签页替换为优雅的书签管理器。采用玻璃拟态设计，自动适配系统深浅色模式。直接读写 Chrome 原生书签数据。

## 架构

```
BookmarkTab/
├── components/     # UI 组件
├── core/           # 数据层与系统基础设施
├── css/            # 样式：main.css 入口 + modules/ 模块
│   └── modules/    # 按功能划分的 CSS 模块
├── icons/          # 扩展图标 + export.html（图标导出工具）
├── wallpapers/     # 壁纸资源与配置（SettingsPanel 使用，待重构）
├── main.js         # 应用入口
└── manifest.json   # Chrome 扩展清单 V3
```

### 核心层（./core/）

- **BookmarkStore.js** — 数据层，封装 `chrome.bookmarks` API。负责增删改查、favicon 缓存（内存 + localStorage 双层）、自定义图标存储、书签树查询。所有书签操作均通过此单例完成。
- **Router.js** — 导航层，管理文件夹层级与浏览器历史集成。维护文件夹路径栈，通过 EventBus 发射 `navigate` 事件。
- **EventBus.js** — 发布/订阅事件系统，解耦各组件。广泛用于跨组件通信（如 `navigate`、`card:dragstart`、`toolbar:newBookmark`）。

### 组件层（./components/）

组件间松耦合，通过 EventBus 事件通信。每个组件通常：
- 在构造函数中订阅相关事件
- 渲染 UI 并绑定 DOM 事件监听器
- 状态变更时发射事件

关键组件：
- **BookmarkGrid.js** — 网格容器，渲染当前文件夹的书签卡片。负责 favicon 分批懒加载、卡片多选、拖拽排序、删除动画。
- **BookmarkCard.js** — 单张书签/文件夹卡片。支持拖拽、右键菜单、行内标题编辑、自定义图标、Toast 提示。
- **Breadcrumb.js** — 面包屑导航栏。
- **EditDialog.js** — 新建/编辑书签或文件夹弹窗。
- **MoveDialog.js** — 移动书签时选择目标文件夹的弹窗。
- **QuickFind.js** — 全局模糊搜索浮层（`/` 或 `Ctrl+F`）。
- **Toolbar.js** — 顶部工具栏，自动隐藏行为。
- **SettingsPanel.js** — 壁纸偏好设置面板（当前未启用，待重构）。

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
- `animations.css` — 卡片入场/悬停动画。
- `shortcuts.css` — 快捷键提示弹窗。
- `settings.css` / `wallpapers.css` — 设置面板与壁纸网格（当前未启用）。
- `base.css` — 全局基础样式。

## 关键模式

**事件驱动通信**：组件间不直接调用。`BookmarkGrid` 监听 Router 的 `navigate`，`Toolbar` 发射 `toolbar:newBookmark` 由 `EditDialog` 捕获，以此类推。

**Favicon 缓存**：`BookmarkStore` 按域名提取并缓存 favicon。主源使用 `chrome-extension://.../_favicon/` API，失败时回退到 Google Favicon API。失败的查找会被标记，防止重复请求风暴。`clearFavicon()` 支持右键菜单手动刷新。

**拖拽区域**：主内容区两侧有不可见的边缘触发区（各占视口宽度的 12%）。左侧显示文件夹树面板作为移动目标，右侧显示删除确认。

**SVG 安全过滤**：自定义图标（SVG）在存储前通过 `DOMParser` 去除 `<script>`、`on*` 事件属性、`javascript:` 和 `data:` 危险链接。

**Toast 提示**：`BookmarkCard._showToast()` 在底部居中显示临时反馈，用于验证错误（如图标过大、SVG 不安全）。使用单例样式块管理入场动画。

**图标上传校验**：自定义图标强制执行文件大小（1 KB – 1 MB）、图片尺寸（最小 32×32）和 SVG 安全检查。校验失败时显示 Toast，而非静默拒绝。

**应用级职责**（`main.js`）：全局快捷键、卡片尺寸持久化（`localStorage`）、拖拽区域协调、菜单面板（跳转方式 + 卡片文字显隐切换）、多选状态管理。

## 开发指南

**加载扩展：**
1. 打开 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择项目根目录
4. 打开新标签页即可使用

**代码修改后：** 在 `chrome://extensions/` 点击扩展卡片上的刷新按钮。

**无构建步骤** — 纯 ES Modules，直接从源码加载。

**无第三方依赖** — 原生 JavaScript（ES2020+）、CSS3、Chrome Extensions Manifest V3。
