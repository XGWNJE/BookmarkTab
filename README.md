# MarkPad

> 面向触控操作的新标签页书签面板。MarkPad 用卡片式书签、统一 SVG 图标和简洁工具头部替代传统书签树。

## 当前状态

MarkPad 是一个 Chrome Manifest V3 扩展，会替换新标签页并直接读写 Chrome 原生书签数据。仓库历史上曾使用 `BookmarkTab` 作为产品名；从当前版本起，用户可见名称统一为 `MarkPad`。部分内部类名和文件名仍保留 `Bookmark*`，用于描述书签领域对象，不作为产品品牌。

视觉系统当前参考 `XGWNJE/visual-rules-collection` 的 Lumen Index 规范：温白/深灰背景、黑白骨架、轻边框、低阴影和克制密度。品牌方向见 [MarkPad Brand Visual Guide](docs/markpad-brand-visual-guide.md)，触控和图标工坊计划见 [MarkPad Touch And Icon Studio MVP Plan](docs/touch-icon-mvp-plan.md)。

## 版本

当前版本：`0.1.0`

本版本重点：统一 MarkPad 产品名，整理顶部工具栏和设置菜单，增加快速搜索、图标工坊、背景偏好、头部透明度和壁纸遮罩透明度。完整变更记录见 [完整变更记录](CHANGELOG.md)。

## 功能

- 卡片式书签和文件夹网格，支持键盘、鼠标和触控/手写笔长按操作。
- 顶部工具栏：面包屑导航、图标化快速查找和设置菜单；设置菜单中包含新建书签/文件夹、打开方式、卡片显示、透明度、背景和快捷键。
- 快速搜索：`/` 或 `Ctrl+F` 全局搜索书签和文件夹。
- 卡片操作：编辑名称、移动、删除、重新匹配默认图标、匹配本地图标、搜索 SVG 图标和上传高清位图。
- 图标工坊：支持本地图标候选和多来源 SVG 搜索；本地候选会展示标题、URL、域名、路径片段和具体匹配依据，不接入模型 API。
- 高清图标策略：默认使用本地品牌图标库，按标题、域名和别名保守匹配；品牌库由 Simple Icons、Iconify Logos、Remix、Ant Design 和 Lobe Icons 生成，通用工具/信息图标由 Lucide 生成。未命中时使用首字母兜底，用户可手动从全量本地候选、SVG 搜索或 256×256 以上位图中自定义图标。
- 壁纸偏好：浅色、暗色和自定义图片，支持缩放模式、背景模糊度和遮罩透明度。
- 卡片文字显示、打开方式和卡片尺寸可配置。

## 快捷键

| 按键 | 功能 |
|------|------|
| `N` / `Shift+N` | 新建书签 / 文件夹 |
| `/` / `Ctrl+F` | 快速搜索 |
| `Backspace` / `Alt+←` | 返回上级 |
| `↑` `↓` `←` `→` | 卡片导航 |
| `Enter` | 打开书签 / 进入文件夹 |
| `F2` | 重命名选中项 |
| `Delete` | 删除选中项 |
| `Ctrl+Click` | 多选 |
| `=` / `-` | 放大 / 缩小卡片 |
| `Escape` | 关闭弹窗或工具面板 |

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库根目录。
4. 打开新标签页即可使用 MarkPad。

修改代码后，在 `chrome://extensions/` 点击扩展卡片上的刷新按钮。

## 项目结构

```
MarkPad/
├── CHANGELOG.md         # 版本历史和发布变更
├── components/          # UI 组件
├── core/                # 数据层、路由、事件总线、应用图标和书签图标解析
├── css/                 # main.css 入口 + modules/ 模块化样式
├── docs/                # 品牌、触控和图标工坊计划
├── icons/               # 扩展图标和 export.html 导出工具
├── wallpapers/          # 历史壁纸资源；当前设置使用 SettingsPanel 内置预设
├── index.html           # 新标签页入口
├── main.js              # 应用装配与全局交互
└── manifest.json        # Chrome 扩展清单
```

## 技术栈

- 原生 JavaScript（ES2020+）
- Chrome Extensions Manifest V3
- CSS3 模块化样式
- 无构建步骤；扩展运行无需 npm 依赖，图标库生成使用 npm devDependency

## 验证

项目目前只有轻量 Node 行为测试，无构建步骤。代码修改后按范围运行：

```powershell
npm test
node --test tests\toolbar-menu.test.mjs
node --test tests\version-system.test.mjs
node --test tests\icon-sanitizer.test.mjs tests\icon-storage.test.mjs tests\icon-library-provider.test.mjs tests\icon-resolver.test.mjs tests\icon-component-integration.test.mjs tests\bitmap-icon-upload.test.mjs
node --check main.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
git diff --check
```

涉及触控交互、弹窗、拖拽、图标工坊、图标库或 Chrome API 行为时，需要刷新扩展后做运行态验证。

## 权限

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读写 Chrome 书签 |
| `storage` | 保存自定义图标、默认图标解析缓存和偏好 |
| `favicon` | 获取网站图标预览，并兼容旧 favicon 流程 |
| `tabs` | 控制书签打开方式与 iconfont 辅助页面 |
| `scripting` | 在已登录的 iconfont 搜索页中抽取 SVG |
