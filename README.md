# BookmarkTab

一个优雅的 Chrome 书签管理新标签页扩展，采用玻璃拟态设计语言。

## 特性

- **玻璃拟态设计** - 毛玻璃效果、渐变色彩、柔和阴影
- **文件夹导航** - 点击文件夹进入，支持面包屑导航跳转任意层级
- **快速搜索** - 按 `/` 或 `Ctrl+F` 呼出搜索
- **书签图标缓存** - 自动缓存 favicon，加速后续加载
- **轻量化** - 纯原生 JS，无框架依赖

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `N` | 新建书签 |
| `Shift+N` | 新建文件夹 |
| `/` 或 `Ctrl+F` | 搜索 |
| `G` | 切换网格/列表视图 |
| `Backspace` 或 `Alt+←` | 返回上级 |
| `↑↓←→` | 卡片导航 |
| `Enter` | 打开书签/文件夹 |
| `Delete` | 删除 |
| `F2` | 重命名 |
| `Escape` | 关闭弹窗 |

## 技术栈

- 原生 JavaScript (ES6+)
- Chrome Extensions API
- CSS3 (Flexbox, Grid, CSS Variables)

## 项目结构

```
├── components/          # UI 组件
│   ├── BookmarkCard.js     # 书签卡片
│   ├── BookmarkGrid.js     # 网格布局
│   ├── Breadcrumb.js       # 面包屑导航
│   ├── EditDialog.js       # 编辑弹窗
│   ├── MoveDialog.js       # 移动弹窗
│   ├── QuickFind.js        # 快速搜索
│   ├── SettingsPanel.js    # 设置面板
│   └── Toolbar.js          # 工具栏
├── core/               # 核心模块
│   ├── BookmarkStore.js    # 书签数据层
│   ├── EventBus.js         # 事件总线
│   └── Router.js           # 路由导航
├── css/
│   └── modules/            # CSS 模块
│       ├── base.css
│       ├── card.css
│       ├── dialog.css
│       ├── grid.css
│       ├── variables.css
│       └── ...
├── icons/              # 图标资源
├── index.html          # 入口页面
├── main.js             # 主入口
└── manifest.json       # 扩展配置
```

## 安装

1. 克隆仓库
2. 打开 Chrome → `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目目录

## 开发

修改代码后，在 `chrome://extensions/` 点击扩展的刷新按钮即可看到更新。

## License

MIT
