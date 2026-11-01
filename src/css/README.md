# 样式目录

样式从 `src/styles.css` 拆分到这里，入口是 `src/css/index.css`，由 `src/main.tsx` 引入。

## 目录

- `base.css`：变量、重置、排版、按钮、表单、通用工具类。
- `components/`：可复用组件样式。
  - `header.css`、`footer.css`、`avatar.css`、`ticker.css`
  - `post-card.css`、`cover-art.css`、`widgets.css`、`seat-card.css`
  - `mascot.css`、`mascot-companion.css`、`guestbook.css`
  - `comments.css`、`search-dialog.css`、`toast.css`、`modal.css`
  - `external-guard.css`、`lab-top.css`、`universe-mark.css`、`radio-top.css`
- `pages/`：页面级样式，按路由页面拆分。
- `shared/`
  - `keyframes.css`：所有 `@keyframes`。
  - `responsive.css`：跨组件的媒体查询。
  - `dark.css`：所有 `[data-theme='dark']` 覆盖。

## 修改方式

1. 先看组件文件顶部的注释，里面会写组件职责和对应样式文件。
2. 组件样式改 `components/`，页面样式改 `pages/`。
3. 只影响夜间模式的规则放 `shared/dark.css`。
4. 新增关键帧放 `shared/keyframes.css`，避免散落在组件里。
5. `index.css` 的导入顺序会影响层叠，调整顺序前先确认影响范围。

## 约定

- 每个 CSS 文件顶部都有一行说明。
- 每个 `.tsx` 组件/页面顶部都有「职责 / 样式」注释。
- 组件样式优先放在对应组件文件，不再往 `base.css` 里堆。
