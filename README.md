# BookmarkTab

> 极简优雅的 Chrome 书签管理新标签页扩展，玻璃拟态设计，自动适配深浅色模式。

## 功能

### 导航
- 面包屑导航，点击任意层级快速跳转
- 浏览器前进/后退支持（`Alt+←` / `Backspace`）
- 快速搜索（`/` 或 `Ctrl+F`），全局书签模糊搜索

### 书签操作
- 右键菜单：重命名、自定义图标
- 支持 PNG / JPG / WebP / GIF / ICO / SVG 文件上传，SVG 自动安全过滤
- 新建书签/文件夹（`N` / `Shift+N`）
- 书签跳转方式可切换（新标签页 / 当前页）

### 拖拽交互
- 卡片间拖拽排序
- 拖入文件夹（中心区域）
- 拖到左侧 → 文件夹树面板，悬停高亮
- 拖到右侧 → 删除确认

### 视觉
- 玻璃拟态背景 + 柔和阴影
- 书签卡片尺寸可调（`=` / `-` 键）
- 文件夹默认图标为 CSS 绘制（标签页 + 主体造型）
- 自动跟随系统深浅色模式

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
| `Escape` | 关闭弹窗 |

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择项目根目录
4. 打开新标签页即可使用

修改代码后在 `chrome://extensions/` 点击刷新按钮。

## 项目结构

```
BookmarkTab/
├── components/          # UI 组件
│   ├── BookmarkCard.js  # 书签卡片（拖拽、右键菜单、自定义图标）
│   ├── BookmarkGrid.js  # 网格容器
│   ├── Breadcrumb.js    # 面包屑导航
│   ├── EditDialog.js    # 新建/编辑弹窗
│   ├── MoveDialog.js    # 移动书签弹窗
│   └── QuickFind.js     # 快速搜索
├── core/                 # 数据层
│   ├── BookmarkStore.js # 书签 API + favicon 缓存
│   ├── EventBus.js      # 事件总线
│   └── Router.js        # 导航路由
├── css/modules/          # CSS 模块
├── main.js              # 应用入口
└── manifest.json
```

## 技术栈

- 原生 JavaScript（ES2020+）
- Chrome Extensions Manifest V3
- CSS3（`backdrop-filter` 玻璃拟态）

## 权限

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读写 Chrome 书签 |
| `storage` | 本地数据存储 |
| `favicon` | 获取网站图标 |
| `tabs` | 控制书签打开方式 |

## 待实现

- 数据导出/导入
- 自定义壁纸系统
- 批量操作
- 使用频率统计
- 鼠标悬停显示书签名称
