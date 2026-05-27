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

MarkPad 不应成为单一蓝紫主题。主色应安静、清晰，辅色用于状态和图标工坊。

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--brand-ink` | `#20242A` | 主要文字、深色符号 |
| `--brand-surface` | `#F5F7FA` | 浅色背景 |
| `--brand-panel` | `#FFFFFF` | 浅色面板 |
| `--brand-mist` | `#DCE9EE` | 柔和背景层 |
| `--brand-accent` | `#3B82F6` | 主操作、选中态 |
| `--brand-mint` | `#28B87A` | 成功、AI 推荐辅助色 |
| `--brand-amber` | `#F4A62A` | 提醒、生成中 |
| `--brand-danger` | `#E05252` | 删除、危险操作 |

### Dark Palette

| Token | Hex | Usage |
|---|---|---|
| `--brand-dark-bg` | `#171A1F` | 深色背景 |
| `--brand-dark-panel` | `#222730` | 深色面板 |
| `--brand-dark-card` | `#2B313B` | 深色卡片 |
| `--brand-dark-text` | `#F2F5F7` | 深色模式文字 |
| `--brand-dark-muted` | `#AAB3C0` | 次级文字 |
| `--brand-dark-accent` | `#6EA8FF` | 深色主操作 |

### Usage Rules

- 主界面以中性灰、冷白和柔和阴影为主。
- `--brand-accent` 只用于可点击主操作、当前选择和焦点。
- 删除操作必须使用 danger 色，不使用普通 accent。
- AI 推荐可使用 mint 作为辅助识别，但不要让 AI 功能抢主视觉。
- 图标工坊可以有更多颜色，但主应用框架保持安静。

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
| Bottom bar label | 12-13px | 500 |
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
- 底部操作栏按钮：建议 `56px` 高

## Component Style

### Bookmark Cards

- 卡片是第一视觉单位。
- 图标区域要清晰，不能被文字挤压。
- 标题默认显示，触控模式不依赖 hover。
- 选中态用边框、轻微背景和勾选标记共同表达。
- 长按进入选择模式时卡片应有明确反馈。

### Bottom Bar

触控方向下，底部操作栏是主控制区。

应包含：

- 返回 / 首页
- 搜索
- 新建
- 选择模式
- 设置

图标优先，必要时加短标签。不要把所有功能塞进一个菜单。

### Icon Studio

图标工坊是 MarkPad 的特色功能，但 UI 应保持工具化。

手动模式：

- 搜索框突出。
- SVG 候选使用网格。
- 选中图标有清晰边框。
- 预览当前卡片效果。

AI 模式：

- 不默认显示搜索框。
- 展示 DeepSeek 生成的分类、搜索词和候选 SVG。
- 提供 `换一批`、`改为手动搜索`、`直接应用 SVG`、`高清生成`。

Grsai 生成：

- 必须有成本/外部 API 调用提示。
- 生成结果由用户确认后应用。
- 不自动覆盖现有自定义图标。

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
- 可以允许用户选择前景色/背景色作为后续增强。

AI 高清生成时：

- 以用户选择的 SVG 为构图参考。
- 输出 1:1 图标。
- 默认 `1024x1024`。
- 不生成文字、字母、品牌 logo 或真实照片。

## Tone Of Voice

界面文案应短、明确、可执行。

推荐：

- `选择图标`
- `AI 推荐`
- `高清生成`
- `应用到当前书签`
- `应用到同域名`
- `恢复 favicon`
- `换一批`
- `改为手动搜索`

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
- AI 和付费 API 调用按钮要可区分于普通本地操作。

## Brand Implementation Checklist

- `manifest.json` 名称最终改为 `MarkPad`。
- README 标题最终改为 `MarkPad`。
- `index.html` title 改为 `MarkPad`。
- 扩展图标按 Logo Direction 重新设计。
- CSS tokens 增加 brand palette。
- 触控模式样式使用 `@media (pointer: coarse)`。
- 图标工坊 UI 遵守本文件的 tone、spacing 和 icon rules。
