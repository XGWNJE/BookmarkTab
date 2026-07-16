# MarkPad Brand Visual Guide

## Brand Name

**MarkPad**

命名含义：

- `Mark` 来自 bookmark，代表书签、标记、常用入口。
- `Pad` 指向平板、触控面板和卡片操作台。
- 合在一起表达“为触控而设计的书签面板”。

中文辅助名可使用 **书签触控板**。中文名只作为解释，不作为主要品牌名。

## Positioning

MarkPad 是面向远程平板触控 PC 场景的新标签页书签面板。

它不是传统书签树，也不是浏览器收藏夹的替代皮肤；它的核心价值是：

- 用大卡片降低触控误操作。
- 用清晰视觉帮助用户快速识别入口。
- 用图标工坊解决 favicon 模糊、杂乱和风格不统一的问题。
- 在鼠标、键盘和触控之间保持兼容，但触控体验优先。

一句话定位：

> Touch-first bookmark deck for Chrome.

中文描述：

> 面向触控操作的新标签页书签面板。

## Brand Personality

MarkPad 的气质应保持：

- **安静**：不像效率工具那样强迫用户管理，也不做过度动效。
- **清晰**：信息层级明确，卡片、图标、操作按钮一眼可辨。
- **亲手感**：按钮和卡片看起来适合被手指按下。
- **有秩序**：视觉统一，图标风格稳定，空间留白克制。
- **个人化**：允许用户选择自己认可的图标和视觉风格。

避免：

- 过度科技感的霓虹蓝紫。
- 复杂插画式首页。
- 大面积营销式 hero。
- 拟物化到像真实办公桌。
- 依赖 hover 才能理解的隐藏 UI。

## Visual Keywords

- touch-first
- card deck
- soft glass
- crisp glyphs
- calm workspace
- high-contrast icons
- rounded but not childish
- quiet productivity

## Logo Direction

Logo 应该优先是一个简单符号，而不是复杂插画。

推荐方向：

1. **M + Card**
   - 用一个抽象 `M` 结合卡片轮廓。
   - 表达 MarkPad 与卡片书签。

2. **Bookmark + Pad**
   - 书签丝带形状放入圆角方形面板。
   - 适合 Chrome extension icon。

3. **Glyph Grid**
   - 2x2 或 3x3 小卡片网格，中间一个高亮 bookmark glyph。
   - 表达图标化书签面板。

Logo 约束：

- 必须在 `16x16` 下仍能识别大轮廓。
- 不使用文字作为主图标。
- 不使用复杂渐变细节。
- 可以使用圆角方形底板，但主体符号要清楚。

## Color System

颜色以 `css/modules/variables.css` 中当前生效的 Lumen Index 令牌为准，不维护脱离实现的第二套品牌令牌。

- 主界面使用温白或深灰背景、黑白骨架、轻边框和低阴影。
- 强调色只用于可点击主操作、当前选择和焦点。
- 删除操作使用危险色，不与普通强调色混用。
- 图标工坊可以展示品牌原色，但应用框架保持安静。

## Typography

中文优先使用系统字体，避免引入 Web Font：

```css
font-family:
  "Inter",
  "Segoe UI",
  "Microsoft YaHei UI",
  "Microsoft YaHei",
  system-ui,
  sans-serif;
```

字号建议：

| Role | Size | Weight |
|---|---:|---:|
| Card title | 14-16px | 500 |
| Card meta | 12px | 400 |
| Dialog title | 18px | 600 |
| Dialog body | 14px | 400 |
| Touch primary button | 15-16px | 600 |

触控模式下不要用过小文字。任何主要按钮文字低于 `13px` 都需要重新评估。

## Shape And Spacing

MarkPad 可以圆润，但不要过度可爱。

| Element | Radius |
|---|---:|
| Bookmark card | 8-12px |
| Touch button | 10-12px |
| Dialog / sheet | 12-16px |
| Icon preview tile | 10px |
| Small chip | 8px |

触控尺寸：

- 主要按钮最小高度：`48px`
- 图标按钮最小触控区域：`44px`
- 卡片间距：至少 `12px`
- 头部工具栏按钮：触控模式下建议 `44-48px` 触控区域

## Component Style

### Bookmark Cards

- 卡片是第一视觉单位。
- 图标区域要清晰，不能被文字挤压。
- 标题默认显示，触控模式不依赖 hover。
- 选中态用边框和轻微背景表达。
- 长按卡片打开与右键一致的操作菜单，触控模式不依赖鼠标右键。

### Header Tools

当前主控制区是顶部工具栏和工具菜单。面包屑、新建、搜索和工具入口保持在头部；跳转方式、卡片文字、壁纸偏好和快捷键归入工具菜单。

头部工具应包含：

- 新建书签 / 新建文件夹
- 面包屑导航
- 搜索
- 工具菜单

图标优先，必要时加短标签。不要重新引入独立底部栏，除非重新设计整体触控信息架构。

### Icon Studio

图标工坊是 MarkPad 的特色功能，但 UI 应保持工具化。

手动模式：

- 搜索框突出。
- SVG 候选使用网格。
- 选中图标有清晰边框。
- 预览当前卡片效果。

当前不提供生图或模型 API 能力：

- 不显示 API 配置。
- 不显示模型选择或生成模式。
- 不提供 `高清生成` 或 `应用高清图标`。
- 只提供 SVG 搜索、预览和 `直接应用 SVG`。

## Icon Style

MarkPad 图标应符合：

- 中心构图。
- 无文字。
- 无水印。
- 不仿冒品牌 logo。
- 轮廓在小尺寸下清楚。
- 适合圆角卡片和深浅色背景。

SVG 直接应用时：

- 保持原始轮廓。

## Tone Of Voice

界面文案应短、明确、可执行。

推荐：

- `选择图标`
- `应用到当前书签`
- `只看 iconfont`
- `打开 iconfont`

避免：

- `智能美化您的书签体验`
- `开启极致效率`
- `一键打造专属视觉空间`
- 任何营销式长句

## Motion

动效应服务于触控反馈：

- 按下：轻微缩放或背景加深。
- 选择：边框/勾选淡入。
- 弹窗/底部抽屉：短距离 slide up。
- 删除：确认后再做淡出，不要在确认前震动或模拟删除。

动画时长：

- 快反馈：`120-180ms`
- 弹层：`180-240ms`
- 删除/应用：`200-300ms`

## Accessibility

- 所有主要操作可键盘触达。
- 触控目标不小于 `44px`。
- 深浅色模式对比度要足够。
- 图标候选必须有 `title` 或 accessible label。
