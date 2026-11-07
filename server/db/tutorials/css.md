## start | 给网页添加第一份样式

准备好 HTML 教程中的学习任务页。本教程从一个外部样式文件开始，逐步完成排版和布局，不依赖组件库。

### connect | HTML 怎样加载 CSS

在 index.html 的 head 中确认存在 `<link rel="stylesheet" href="./style.css">`，然后编辑同目录下的 style.css：

```css
body {
  background: #f6f7f9;
  color: #202936;
  font-family: system-ui, sans-serif;
}
h1 {
  color: #244d80;
}
```

保存后刷新，背景和标题应改变。若完全没变化，打开 Network 查找 style.css，确认状态正常、响应内容确实是 CSS，而不是路径错误返回的 HTML。CSS 文件里不用写 style 标签。

行内 style、head 中的 style 元素也能设置样式，但本教程统一使用外部文件，方便维护和比较差异。

官方文档：[开始使用 CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Getting_started)

### rules | 选择器、声明与分号

```css
.task-form {
  padding: 20px;
  border: 1px solid #c8d0dc;
  border-radius: 12px;
}
```

`.task-form` 是选择器，花括号里是声明；每条声明由属性、冒号和值组成，用分号分隔。属性名和多数关键字使用英文，中文全角冒号、分号可能导致解析失败。注释使用 `/* 说明 */`。

浏览器遇到无效属性或值时，通常忽略对应声明，而不是让整份样式都停止。因此“没有报错弹窗”不能说明 CSS 全部有效。开发者工具中被划掉或带提示的声明值得检查。

官方文档：[CSS 语法](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_syntax/Syntax)

### inspect | 用 Styles 与 Computed 定位问题

检查标题元素，在 Styles 中找到匹配规则，尝试取消勾选 color。Computed 显示最终计算值，盒模型面板显示内边距、边框和外边距。临时调整满意后，再写回源文件。

每次只改变一个变量：先确定规则是否匹配，再看是否被覆盖，最后看布局空间是否允许。不要通过不停追加同一选择器来碰运气，这会让后续修改越来越难理解。

练习：把标题颜色改成另一种颜色，找到它的实际来源，并解释为什么页面里另一个段落没有一起改变。

官方文档：[调试 CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Debugging_CSS)

## selectors | 选中正确的元素

选择器越清楚，样式影响范围越容易控制。优先给可复用区域设置类名。

### basic | 类型、类与 id

```css
p { line-height: 1.7; }
.task-list { list-style: none; }
#task-status { min-height: 1.7em; }
.task-item.is-done { opacity: .7; }
```

p 匹配所有段落，点号匹配 class，井号匹配 id。`.task-item.is-done` 表示同一元素同时具有两个类，`.task-item .is-done` 则表示前者内部的后代，两者不同。

类名大小写应保持一致。多个选择器共用同一规则时用逗号，例如 `button, input { font: inherit; }`。id 适合页面关联，日常组件样式一般更容易用类名组合。

官方文档：[CSS 选择器](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Basic_selectors)

### relationships | 后代、子元素与相邻元素

```css
.site-header a { text-decoration: none; }
.task-list > li { padding: 12px; }
.task-item + .task-item { margin-top: 8px; }
```

空格选择任意深度的后代；大于号只选直接子元素；加号选择紧随其后的同级元素。结构变化后，深层选择器可能意外影响嵌套内容，所以不要写过长的链条来绑定整份 DOM。

练习：在任务项内部新增一个说明列表，比较 `.task-list li` 与 `.task-list > li` 的影响范围。

官方文档：[组合器](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors/Selectors_and_combinators)

### states | 属性、伪类与键盘焦点

```css
input[type="checkbox"] { accent-color: #275e92; }
button:hover { background: #204c75; }
button:disabled { opacity: .5; cursor: not-allowed; }
button:focus-visible, a:focus-visible, input:focus-visible {
  outline: 3px solid #946600;
  outline-offset: 3px;
}
```

属性选择器匹配带特定属性的元素。hover 表示悬停状态，但触屏不一定有持续悬停；focus-visible 适合显示用户需要的焦点提示。不要只有 hover 效果，却没有键盘焦点样式。

练习：不用鼠标，按 Tab 走遍页面。你应一直能看出焦点在哪里。

官方文档：[伪类](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) · [focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

### generated | 伪元素与真实内容

```css
.required-label::after {
  content: " *";
  color: #a32b2b;
}
```

before 和 after 可添加装饰，但不能替代重要正文、表单标签或错误说明，因为生成内容在复制、翻译和辅助技术中的表现可能不同。重要的“必填”说明应在 HTML 中可读，星号只是补充。

练习：给章节标题加一个装饰短线，不改变标题文本；检查复制标题时仍能得到完整文字。

官方文档：[伪元素](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements)

## cascade | 为什么我的样式没有生效

先检查加载、匹配和有效性，再分析覆盖。不要把所有问题都归因于“权重不够”。

### order | 级联与声明顺序

```css
.note { color: #245b8a; }
.note { color: #7a3e51; }
```

在来源、重要性、层等条件相同，且选择器优先级相同的情况下，后出现的声明胜出，所以这里显示第二个颜色。来自不同来源、不同层或带 important 的规则，需要先比较那些条件。

如果文件中同一个选择器出现很多次，先整理相关规则。样式顺序应表达明确的覆盖关系，例如基础按钮在前、禁用状态在后。

官方文档：[CSS 级联](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)

### specificity | 选择器优先级

```css
p { color: gray; }
.note { color: navy; }
#intro { color: maroon; }
```

若同一个 p 同时带 class=note 和 id=intro，在其他级联条件相同时，id 规则比类规则优先，类比类型优先。不要把优先级理解成一个可以任意进位相加的十进制总分。

解决冲突时，优先减少不必要的 id 和深层结构依赖，或把组件状态写清楚。important 不是日常修补所有问题的工具；使用后需要理解它与其他重要声明的顺序关系。

官方文档：[优先级](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)

### inheritance | 哪些值会继承

color 和字体相关属性通常会从父元素继承，margin、padding、border 通常不会。表单控件的默认字体可能来自浏览器样式，因此常显式设置 `button, input, textarea, select { font: inherit; }`。

inherit 要求继承父值；initial 使用属性初始值；unset 对可继承属性表现为 inherit，对其他属性表现为 initial。不要把 initial 当作“恢复浏览器为某元素设定的全部默认外观”。

练习：只在 body 上改 color，观察标题、段落、链接和按钮。然后逐一查看它们是否有更具体的规则。

官方文档：[继承](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance)

### variables | 用自定义属性保存共同值

```css
:root {
  --page-bg: #f6f7f9;
  --text: #202936;
  --accent: #275e92;
  --space: 16px;
}
body { background: var(--page-bg); color: var(--text); }
.task-form { padding: var(--space); border-color: var(--accent); }
```

自定义属性通常会继承，可在组件内重新定义。`var(--name, fallback)` 提供变量缺失时的回退值，但不等于能修复所有类型不匹配。先集中管理重复的颜色和间距，再决定是否需要复杂主题系统。

官方文档：[CSS 自定义属性](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)

## box | 盒模型、宽度与溢出

每个元素都参与某种盒布局。看清内容区、内边距、边框和外边距，才能解释尺寸从哪里来。

### model | 四层空间如何计算

```css
.card {
  width: 300px;
  padding: 20px;
  border: 2px solid #c8d0dc;
  margin: 16px;
}
```

默认 content-box 下，width 只指定内容区，所以边框盒宽度是 300 + 40 + 4 = 344px，外边距再占据周围空间。使用 border-box 后，300px 包含内边距和边框，内容区相应缩小。

```css
*, *::before, *::after { box-sizing: border-box; }
```

练习：在开发者工具盒模型面板中分别切换两种值，核对实际宽度。不要靠目测判断“明明设置 300px 为什么更宽”。

官方文档：[盒模型](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)

### display | block、inline 与 inline-block

普通块级盒通常换行并占据可用宽度；行内盒参与文字排版，width、height 不像块级盒那样控制布局；inline-block 保持行内排列，同时允许设定盒尺寸。display:none 会让元素不再占布局空间，也通常使其不进入无障碍树。

`visibility:hidden` 通常保留布局位置；`opacity:0` 仅透明，元素可能仍能接收点击和焦点。因此隐藏一个可交互菜单时，不能只把透明度设为零。

官方文档：[display](https://developer.mozilla.org/en-US/docs/Web/CSS/display) · [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility)

### sizing | 让容器在窄屏自动收缩

```css
.page {
  width: min(100% - 32px, 760px);
  margin-inline: auto;
}
img { max-width: 100%; height: auto; }
.task-title { overflow-wrap: anywhere; }
```

页面宽度最多 760px，小屏两边各留 16px。auto 外边距在有剩余空间时居中。max-width 限制图片不能超出容器，height:auto 保持比例。

px 是 CSS 像素，不一定等于设备的一个物理像素。rem 相对根元素字号，em 在多数属性上相对当前元素字号，百分比的基准依属性而异。先明确参照对象，再选择单位。

官方文档：[CSS 值与单位](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units) · [min()](https://developer.mozilla.org/en-US/docs/Web/CSS/min)

### overflow | 找出横向滚动的真正来源

常见来源包括固定宽度、过长单词、图片原尺寸、Flex/Grid 项目的最小尺寸，以及在 100% 宽度上额外加内边距。先检查溢出的具体元素，不要直接给 body 加 overflow:hidden 来掩盖。

代码块和表格可以在自己的容器中使用 `overflow:auto`。Flex 或 Grid 中需要收缩的内容常要 `min-width:0`。普通垂直块的相邻外边距可能折叠；使用容器 padding 或布局 gap，可以更清楚地表达组件间距。

官方文档：[溢出](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Overflow) · [外边距折叠](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)

## typography | 文字、颜色与背景

先保证阅读，再添加装饰。字号、行距、行长和对比度需要一起调整。

### text | 字体与行距

```css
body { font: 1rem/1.7 system-ui, sans-serif; }
h1 { font-size: clamp(1.8rem, 5vw, 2.8rem); line-height: 1.2; }
p { max-width: 65ch; }
button, input { font: inherit; }
```

无单位 line-height 会按各元素自身字号计算，继承时通常更容易控制。ch 大致以字体中“0”的宽度为基准，不等于固定数量的中文字。clamp 给流动字号设置上下限，避免在极窄或极宽屏幕上失控。

不要把整页字体锁得太小，也不要禁止用户缩放。放大浏览器到 200%，检查内容是否仍能阅读和操作。

官方文档：[基础文字样式](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Text_styling/Fundamentals) · [clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)

### colors | 颜色、透明度与对比

```css
.card {
  color: #253044;
  background: #fff;
  border: 1px solid rgb(37 48 68 / 18%);
}
```

十六进制、rgb、hsl 等都能描述颜色。颜色通道中的透明度只影响该颜色；opacity 会影响整个元素及其后代，文字也会一起变淡。

不要只靠红绿表达失败或完成，还应有文字、图标或结构差异。普通文本通常需要至少 4.5:1 的对比度，大号文本要求有所不同。用浏览器或对比度工具检查真实前景和背景，尤其是透明背景和图片上的文字。

官方文档：[CSS 颜色](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors) · [W3C 对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

### decoration | 边框、圆角与阴影

```css
.task-form {
  background: white;
  border: 1px solid #d6dce5;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgb(20 35 55 / 5%);
}
```

边框参与盒模型，outline 通常不占布局空间，适合焦点提示。圆角不会自动裁剪所有后代内容；确实需要裁剪时再设置 overflow，并确认不会切掉焦点或弹出内容。

阴影和渐变应服务于层次，不需要每个元素都加一层。先把字号和间距调好，再判断是否真的需要装饰。

官方文档：[边框与背景](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Backgrounds_and_borders)

## flex | 用 Flex 排列一行或一列

Flex 适合导航、输入框与按钮、任务行等单一主轴上的布局。

### axes | 主轴与交叉轴

```css
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
```

默认主轴沿行方向，align-items 控制交叉轴对齐，justify-content 分配主轴空间。把 flex-direction 改为 column 后，主轴变为列方向，两个属性的视觉方向也跟着变化。

gap 表达项目之间的间距，不需要给每个项目加补偿外边距。容器内部没有多余空间时，space-between 不会凭空产生空间。

官方文档：[Flexbox 基础](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)

### growth | 输入框伸缩与最小宽度

```css
.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; min-width: 0; }
.input-row button { flex: 0 0 auto; }
```

输入框占据剩余空间，按钮保留自己的宽度。min-width:0 允许项目收缩到内容固有最小宽度以下，避免长内容把页面撑开。flex 简写涉及增长、收缩和基础尺寸，不能简单理解为“设置一个宽度百分比”。

练习：给输入框写一串长文字，缩窄窗口，确认按钮仍可点击且页面没有横向滚动。

官方文档：[控制 Flex 项目的比例](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis)

### wrapping | 换行与阅读顺序

```css
.topic-links { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.task-item { display: flex; align-items: flex-start; gap: 12px; }
.task-item label { flex: 1; min-width: 0; }
```

flex-wrap 允许项目在空间不足时换行。order 和 row-reverse 能改变视觉顺序，但不一定同步改变键盘焦点与阅读顺序，因此正文和表单应先把 HTML 顺序写正确。

练习：把导航放入窄容器，比较允许换行与强行缩小字号的效果。优先选择内容仍然可读的布局。

官方文档：[Flex 换行](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Mastering_wrapping_of_flex_items)

## grid | 用 Grid 安排二维布局

需要行和列一起协调时，Grid 往往比多层 Flex 更直接。

### columns | 定义列与轨道

```css
.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
```

三列均分可分配空间，gap 位于列间。fr 是剩余空间的比例，不是把容器含间距简单切成百分比。minmax(0,1fr) 允许列内内容合理收缩，配合内容换行避免溢出。

练习：放入三张字数不同的卡片，观察同一行如何对齐。再把其中一张内容换成很长的 URL，检查最小宽度与换行。

官方文档：[Grid 基础](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout)

### adaptive | 自动填充与最小列宽

```css
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 18px;
}
```

空间允许时出现多列，不足时收为一列。内层 min 避免最小 240px 在更窄容器中溢出。auto-fit 与 auto-fill 对空轨道的处理不同，可在开发者工具 Grid 覆盖层中比较。

不要仅根据自己的桌面宽度写死四列。布局应该根据实际容器空间调整。

官方文档：[repeat()](https://developer.mozilla.org/en-US/docs/Web/CSS/repeat) · [minmax()](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax)

### areas | 侧栏与正文

```css
.docs-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}
```

侧栏固定在一个可读宽度，正文占余下空间。要做手机布局，稍后用媒体查询改为单列。先在 DOM 中按合理顺序写出导航和正文，不用 CSS 把它们反复换位。

练习：打开 Grid 辅助线，指出每条列边界和 gap。修改 260px，观察正文如何变化。

官方文档：[Grid 布局指南](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)

## responsive | 响应式、定位与层叠

页面需要应对窄屏、放大、长文字与不同输入方式，不能只在一张截图中成立。

### breakpoints | 从单列开始增加空间

```css
.page { width: min(100% - 32px, 760px); margin-inline: auto; }
.input-row { display: flex; flex-direction: column; gap: 10px; }
@media (min-width: 40rem) {
  .input-row { flex-direction: row; }
}
```

基础样式先适应小屏，再在空间足够时增加横向排列。断点依据内容何时拥挤，而不是只背“手机 768px”。rem 断点也受环境设置影响，应在实际浏览器中观察。

练习：缓慢拖动窗口宽度，而不是只检查最大和最小两种状态。中间宽度同样不能出现按钮挤压和横向滚动。

官方文档：[响应式设计](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) · [媒体查询](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)

### position | relative、absolute、fixed 与 sticky

relative 通常保留原来的布局位置，再施加偏移；absolute 脱离普通文档流，定位参照由包含块规则决定，常见做法是在父元素设置 position:relative；fixed 通常相对视口，但某些祖先属性会改变其包含块；sticky 在滚动范围内达到阈值后吸附。

```css
.sidebar { position: sticky; top: 20px; }
.field { position: relative; }
.field .status-icon { position: absolute; right: 12px; top: 12px; }
```

sticky 需要设置至少一个相关方向的阈值，并留出可滚动空间。祖先的 overflow 和容器高度会影响它，不能只加 sticky 就期待所有布局都有效。

官方文档：[position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

### stacking | z-index 不是全页面统一排名

元素可能处于不同层叠上下文。一个子元素设置再大的 z-index，也不一定越过另一个上下文中的兄弟区域。transform、某些定位与 z-index 组合、opacity 等都可能产生新的上下文。

遇到菜单被遮住，先检查祖先是否裁剪内容，再检查层叠上下文。不要依次尝试 999、9999、99999。弹窗通常需要明确放置位置、遮罩、焦点管理与滚动策略，单靠 z-index 不够。

官方文档：[层叠上下文](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context)

### testing | 具体的响应式检查方法

检查 320px 左右的窄窗口、常见桌面宽度和横屏；放大浏览器到 200%；粘贴长任务、长 URL 和较多条目；使用键盘和触屏模拟操作。每次发现问题，记录是哪个元素、哪种宽度和哪个状态。

不要隐藏有用内容来让截图变干净。优先允许文本换行、容器收缩和布局变为单列；确实需要横向阅读的表格，在局部容器中滚动。

官方文档：[测试响应式设计](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)

## effects | 状态变化与简单动画

动画应帮助理解操作结果。先确保没有动画时，状态变化仍然明确。

### transitions | 为明确属性添加过渡

```css
button { transition: background-color .16s ease, transform .16s ease; }
button:active { transform: translateY(1px); }
.task-item { transition: opacity .16s ease; }
.task-item.is-done { opacity: .72; }
.task-item.is-done .task-title { text-decoration: line-through; }
```

transition 在属性值变化时插值。尽量列出实际需要的属性，而不是一律 transition:all，避免未来新增属性也意外动画。transform 改变绘制结果，通常不会像修改宽度一样重新安排周围布局，但仍需注意点击区域、裁剪和性能。

官方文档：[CSS 过渡](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions)

### keyframes | 一次性的提示效果

```css
@keyframes arrive {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.task-item { animation: arrive .2s ease-out; }
```

关键帧定义变化过程，animation 决定时间和播放方式。给每个任务加动画只是教学示例，真正应用中若每次重建列表都重播，会使交互显得跳动。先理解触发时机，再决定哪些新元素需要动画。

官方文档：[CSS 动画](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)

### preferences | 尊重减少动态效果的设置

```css
@media (prefers-reduced-motion: reduce) {
  .task-item { animation: none; }
  button { transition: none; }
  html { scroll-behavior: auto; }
}
```

当系统要求减少运动时，取消不必要的移动和滚动动画，状态仍然通过文字、边框或颜色表达。不要把有意义的信息只放进持续闪烁或快速运动中。

练习：在开发者工具模拟 reduced motion，确认任务状态仍然可见，页面没有依靠动画才能发现的操作结果。

官方文档：[prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## project | 完成学习任务页的 CSS

把以下样式保存到 HTML 教程中的 style.css。它为 JavaScript 教程将生成的任务行也准备了样式。

### stylesheet | 一份可运行的完整样式

```css
:root {
  --bg: #f5f6f8;
  --paper: #fff;
  --text: #233044;
  --muted: #536277;
  --line: #cfd7e2;
  --accent: #275e92;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 1rem/1.7 system-ui, sans-serif; }
button, input { font: inherit; }
a { color: var(--accent); text-underline-offset: 3px; }
.site-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px max(16px, calc((100vw - 760px) / 2)); border-bottom: 1px solid var(--line); background: var(--paper); }
.brand { color: var(--text); font-weight: 700; text-decoration: none; }
.page { width: min(100% - 32px, 760px); margin: 40px auto; }
h1 { margin: 0 0 24px; font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.2; }
h2 { font-size: 1.3rem; }
.task-form { padding: 20px; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; }
.task-form label { display: block; margin-bottom: 8px; font-weight: 600; }
.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; min-width: 0; width: 100%; padding: 9px 12px; color: inherit; border: 1px solid #9dabbc; border-radius: 6px; background: var(--paper); }
button { padding: 9px 14px; border: 1px solid var(--accent); border-radius: 6px; background: var(--accent); color: white; cursor: pointer; }
button:hover { background: #204c75; }
button:disabled { opacity: .5; cursor: not-allowed; }
:is(a, button, input):focus-visible { outline: 3px solid #946600; outline-offset: 3px; }
#task-status { min-height: 1.7em; color: var(--muted); }
.task-list { list-style: none; margin: 0 0 20px; padding: 0; display: grid; gap: 10px; }
.task-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); }
.task-item label { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
.task-item input { margin-top: 7px; accent-color: var(--accent); }
.task-title { overflow-wrap: anywhere; }
.task-item.is-done .task-title { color: var(--muted); text-decoration: line-through; }
.delete-task { flex-shrink: 0; padding: 2px 8px; background: transparent; color: #8a3030; border-color: #d5abab; }
.delete-task:hover { background: #fff0f0; }
.site-footer { width: min(100% - 32px, 760px); margin: 48px auto 24px; color: var(--muted); font-size: .85rem; }
.skip-link { position: absolute; top: 8px; left: 8px; transform: translateY(-180%); padding: 8px; background: white; }
.skip-link:focus { transform: translateY(0); }
@media (max-width: 32rem) {
  .input-row { flex-direction: column; }
  .site-header { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: no-preference) {
  button { transition: background-color .16s ease; }
}
```

注意：HTML 的 hidden 属性应该能隐藏空状态等元素。不要随意给 `[hidden]` 元素设置 display:flex 或 grid，覆盖浏览器的隐藏行为。

官方文档：[CSS 参考](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)

### verify | 用具体内容验证布局

暂时向任务列表放入一个 li，内部有 label、checkbox、class=task-title 的 span 和 class=delete-task 的按钮。检查短文本、三行长文本和没有空格的长字符串。接入 JavaScript 后，列表将由 render 函数生成，可以移除临时内容。

依次测试：320px 窄屏、桌面宽屏、200% 缩放、键盘焦点，以及输入框和按钮是否仍能触达。出现溢出时指出具体元素，并解释应该改 min-width、换行还是容器宽度。

官方文档：[CSS 调试](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Debugging_CSS)

### next | 把外观与状态连接起来

继续 [JavaScript 入门](/encyclopedia/javascript)，学习怎样在任务完成时切换 is-done 类、如何更新状态文字和保存列表。样式已经定义好，但用户操作不会自行改变 class，这需要脚本明确处理。

自测：能否不用 absolute 完成输入框与按钮的排列？能否解释一个规则为什么被覆盖？能否在没有固定页面高度的情况下保持内容可读？

官方文档：[MDN CSS 学习模块](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics)
