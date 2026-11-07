## start | 创建第一个网页

HTML 描述内容及其含义，CSS 决定呈现方式，JavaScript 处理交互。本教程先完成结构，不要求安装框架、包管理器或构建工具。

### web | 浏览器怎样显示网页

访问网站时，浏览器向服务器请求资源，收到 HTML 后解析内容，并继续获取其中引用的 CSS、脚本和图片。浏览器把 HTML 组织成文档树，供样式和脚本操作。

URL 中的协议说明如何访问，例如 `https:`；域名帮助定位服务；路径定位具体资源。`https://example.com/notes/index.html` 与电脑上的 `file:///.../index.html` 不同：前者经过 Web 服务器，后者直接读取本地文件。简单 HTML 可直接打开；后续的模块脚本和请求示例需要本地服务器。

把地址栏中的网址与页面里的文字区分开。你在编辑器修改的是源文件，浏览器显示的是解析后的结果。每次修改先保存，再刷新。

官方文档：[Web 如何工作](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works)

### files | 建立练习目录

创建名为 `learning-site` 的文件夹，在编辑器打开它。新建 `index.html`，确认文件扩展名没有被系统隐藏成 `.html.txt`。使用 UTF-8 保存文件。

```text
learning-site/
├── index.html
└── images/
```

初期只需要编辑器、浏览器和一个文件夹。双击 index.html 或拖入浏览器即可查看基础页面。后续添加 CSS 和 JS 时，把文件放在同一项目中，避免代码引用到桌面上另一个同名文件。

练习：在编辑器写一行“我的第一个网页”，保存并刷新，确认浏览器确实显示这份文件。若没有变化，先核对地址栏路径和文件保存状态。

官方文档：[处理文件](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files)

### document | 写出完整页面骨架

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>学习笔记</title>
  </head>
  <body>
    <h1>学习笔记</h1>
    <p>今天开始学习 HTML。</p>
  </body>
</html>
```

doctype 让浏览器按标准模式处理文档；html 包裹整个页面，lang 表示主要语言；head 放标题、编码和资源信息；body 放用户看到的内容。title 显示在浏览器标签页，h1 显示在正文，两者用途不同。

viewport 让手机按设备宽度布局，但它不会自动把不合理的固定宽度变成响应式。复制骨架后，分别修改 title 和 h1，观察标签页与正文的区别。

官方文档：[HTML 文档结构](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax) · [viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)

### inspect | 用开发者工具检查

在正文文字上右键选择检查，找到 Elements 或 Inspector 面板。展开 html、head、body，观察节点关系。临时修改面板里的文字，会立即改变页面，但刷新后通常丢失，因为它没有写回项目源文件。

如果页面乱码，检查文件编码和 meta charset；如果新增文字没显示，检查是否保存、是否打开正确文件、内容是否误放进注释或 script 中。浏览器会尝试修复错误 HTML，因此“能显示”不等于结构正确。

练习：先在开发者工具改标题，再刷新；然后在编辑器改标题并保存刷新。解释为什么两次结果不同。

官方文档：[浏览器开发者工具](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools)

## syntax | 标签、属性与嵌套

理解元素的组成后，再增加更多标签。不要把 HTML 当成需要背完所有标签才能开始的语言。

### element | 开始标签、内容与结束标签

```html
<p>我在学习 <strong>HTML</strong>。</p>
```

整个 p 是一个元素，`<p>` 是开始标签，`</p>` 是结束标签。strong 嵌套在 p 里面，表示这段内容很重要。先开始的外层元素最后结束，顺序类似括号。

不要写成 `<p><strong>文字</p></strong>`。段落中也不要放 div、另一个 p 或 section 等块级结构，浏览器可能自动结束段落，得到与你源码想象不同的树。

缩进帮助人阅读，不会自动改变父子关系。练习：在开发者工具检查嵌套后的实际结构，再故意写错一次闭合顺序，观察浏览器如何修复。

官方文档：[HTML 基础语法](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)

### attributes | 属性、布尔值与空元素

```html
<a href="./notes.html" class="note-link">阅读笔记</a>
<img src="./images/desk.jpg" alt="书桌上的笔记本" width="640" height="480">
<button type="button" disabled>暂不可用</button>
```

属性放在开始标签里，通常是 `名称="值"`，多个属性用空格分开。href 决定链接地址，src 决定图片资源地址。img、input、meta 等是空元素，不写结束标签；在 HTML 中末尾的斜线不会让普通元素变成自闭合元素。

disabled 是布尔属性：只要存在，通常就表示启用这个状态。`disabled="false"` 仍然会禁用按钮；想启用应去掉属性。title 是补充信息，不能代替可见标签或图片的 alt。

官方文档：[HTML 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes) · [空元素](https://developer.mozilla.org/en-US/docs/Glossary/Void_element)

### identifiers | id、class 与 data 属性

```html
<section id="today" class="note-section">
  <h2>今日笔记</h2>
  <p class="note-text" data-topic="html">学习元素嵌套。</p>
</section>
```

同一文档中的 id 应唯一，可用来跳转和关联标签。class 可以重复，一个元素也可以有多个 class，用空格分开，例如 `class="card featured"`。data-* 保存页面脚本需要的少量自定义信息，不等于数据库，也不适合放秘密。

选择命名时表达用途，如 note-section，而不是只表达某次外观的 red-left-box。之后修改颜色，名称仍然成立。

官方文档：[全局属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes) · [data-*](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/data-*)

### characters | 空白、特殊字符与注释

```html
<p>要显示标签文字，可以写：&lt;h1&gt;标题&lt;/h1&gt;</p>
<p>版权符号：&copy;，连接词符号：&amp;</p>
<!-- 这里记录维护说明，不会直接显示为正文。 -->
```

普通文本中连续空格和换行通常被折叠。需要显示保留格式的文本可使用 pre；代码可配合 code。不要通过连续 br 或大量不换行空格来控制页面布局，布局交给 CSS。

注释仍然会被发送给浏览器，查看源码就能看到，不应保存密码或未公开资料。需要显示小于号、大于号和 & 时使用相应字符引用，避免浏览器把它们误认为标记。

官方文档：[字符引用](https://developer.mozilla.org/en-US/docs/Glossary/Character_reference) · [pre](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/pre)

## text | 组织可阅读的文本

本章把一段学习材料整理成有层级的文档。先表达内容关系，再考虑字号和颜色。

### headings | 标题与段落的层级

```html
<h1>Web 学习笔记</h1>
<p>记录每天练习中遇到的问题。</p>
<h2>HTML</h2>
<h3>元素与属性</h3>
<p>属性为元素补充信息。</p>
<h2>CSS</h2>
```

h1 到 h6 表达标题层次。不要因为 h4 默认更小，就在 h1 后直接使用 h4。标题应描述其后内容，字号由 CSS 调整。段落用 p，把一句话拆成多个 p 还是放在同一段，应依据内容而非想制造多少空白。

练习：给一篇约三百字的笔记安排一个 h1、两个 h2 和若干 p，检查能否只看标题就理解组织方式。

官方文档：[标题与段落](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs)

### lists | 有序、无序与描述列表

```html
<ul>
  <li>浏览器</li>
  <li>编辑器</li>
</ul>
<ol>
  <li>保存文件</li>
  <li>刷新页面</li>
</ol>
<dl>
  <dt>HTML</dt>
  <dd>描述网页结构与内容语义。</dd>
</dl>
```

无先后关系用 ul，步骤或排名用 ol，每项用 li。术语与解释适合 dl、dt、dd。嵌套列表放在对应 li 内，而不是与 li 并列。是否显示圆点或数字可以由 CSS 调整，但不要为了外观换掉真实语义。

练习：把“准备工具”写成无序列表，“发布步骤”写成有序列表，“术语表”写成描述列表。

官方文档：[列表](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Lists)

### meaning | 强调、引用与代码

```html
<p><strong>提交前保存文件。</strong> 这是必须检查的步骤。</p>
<p>我<em>确实</em>运行过这个示例。</p>
<blockquote cite="https://example.com/source">
  <p>这里放引用的原文。</p>
</blockquote>
<pre><code>const count = 1;
console.log(count);</code></pre>
```

strong 表示重要性，em 表示语气强调。blockquote 表示较长引用，引用来源还应以读者可见的链接说明，cite 属性本身不会自动成为可见出处。code 表示代码，pre 保留排版。

不要只为加粗就给整个页面套 strong，也不要用 blockquote 表示纯装饰的左边框。

官方文档：[文本语义](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) · [blockquote](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/blockquote)

### dates | 日期、缩写与练习

```html
<p>更新于 <time datetime="2026-11-05">2026 年 11 月 5 日</time>。</p>
<p><abbr title="HyperText Markup Language">HTML</abbr> 是标记语言。</p>
```

time 的 datetime 提供机器容易识别的值，可见文字则可以按阅读习惯书写。abbr 标记缩写，但首次出现时仍建议用正文解释，不依赖鼠标悬停才能看懂。

本章练习：写一页“今天学了什么”，包含标题、日期、三个要点、一段代码和一个术语解释。关闭 CSS 后，内容顺序仍然应当合理。

官方文档：[time](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time) · [abbr](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/abbr)

## links | 链接、路径与导航

链接把页面连接起来。大多数“点了没反应”或“本地正常、上线失败”的问题，都值得先检查路径。

### paths | 相对路径从哪里开始算

```text
learning-site/
├── index.html
├── notes/
│   └── html.html
└── images/
    └── desk.jpg
```

从 index.html 链接笔记，写 `./notes/html.html`；从 notes/html.html 返回首页，写 `../index.html`；在笔记中引用图片，写 `../images/desk.jpg`。一个 `..` 表示上一级目录。

以 `/` 开头通常从网站根路径计算，以 `https://` 开头是完整地址。部署到带项目名前缀的网站时，要特别检查根路径引用。HTML 中的资源路径以文档为基准；CSS 文件里的 url 通常以该 CSS 文件地址为基准。

官方文档：[创建超链接](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links)

### anchors | 页面内跳转与可理解的链接文字

```html
<a href="#contact">联系信息</a>
<a href="./notes/html.html">HTML 学习笔记</a>
<section id="contact">
  <h2>联系信息</h2>
  <p>请在仓库 Issue 中反馈。</p>
</section>
```

`#contact` 跳到当前文档的对应 id。链接文字应独立说明目的，尽量不用一排没有上下文的“点击这里”。如果目标没有匹配 id，地址栏可能变化，页面却找不到对应位置。

不要把按钮套在链接里，也不要把一个链接套进另一个链接。导航到地址用 a，在当前页面执行动作使用 button。

官方文档：[a 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)

### external | 新标签、邮件与下载

```html
<a href="https://developer.mozilla.org/" target="_blank" rel="noopener noreferrer">MDN 文档（新标签页）</a>
<a href="mailto:hello@example.com">发送邮件</a>
<a href="./files/checklist.txt" download>下载检查清单</a>
```

新标签不是所有链接的默认最佳选择，需要时给用户明确提示。mailto 会交给用户配置的邮件程序，并不代表网站已经发出邮件。download 常用于同源下载资源，跨域和服务端响应头可能影响实际行为。

练习：故意把路径写错，打开 Network 查看 404，再修正路径。不要把浏览器已经缓存的旧页面当作文件仍然存在的证明。

官方文档：[a 的属性与行为](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)

### navigation | 做一个可用的导航栏

```html
<nav aria-label="主导航">
  <ul>
    <li><a href="./index.html" aria-current="page">首页</a></li>
    <li><a href="./notes/html.html">HTML 笔记</a></li>
  </ul>
</nav>
```

nav 表示一组主要导航链接，aria-label 为存在多个导航区时提供区分，aria-current 标明当前项。它不会自动添加视觉样式，下一门 CSS 教程会处理布局。

使用 Tab 移到每个链接，再按 Enter。不要为了追求外观把焦点轮廓全部去掉。链接必须在键盘操作下仍能被识别。

官方文档：[nav](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/nav) · [aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)

## media | 图片与媒体内容

资源要能加载，内容也要能在图片缺失或用户不能观看时被理解。

### images | src、alt 与尺寸

```html
<img src="./images/desk.jpg" alt="木桌上的蓝色笔记本和一支钢笔" width="800" height="600">
```

src 指向实际图片。alt 根据图片在当前上下文中的作用描述内容；纯装饰图片可以用空 alt，让辅助技术略过。不要省略 alt，也不要所有图片都写“图片”。如果图片是唯一的链接内容，替代文字应说明链接目的。

width 和 height 提供原始尺寸比例，浏览器可提前预留空间，减少加载后的跳动。响应式缩放稍后用 CSS 的 max-width 和 height:auto 完成。

官方文档：[img](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) · [图片替代文本](https://www.w3.org/WAI/tutorials/images/)

### figures | 图注与延迟加载

```html
<figure>
  <img src="./images/layout.png" alt="上方导航、下方三列卡片的页面布局" width="960" height="540" loading="lazy">
  <figcaption>笔记首页的布局草图。</figcaption>
</figure>
```

figure 把内容与图注组织在一起。figcaption 是可见说明，不总是能代替 alt。lazy 适合页面下方暂时看不到的图片；首屏关键图片通常不应全部延迟加载。

练习：删除或改错 src，观察 alt 的作用；再恢复路径，压缩过大的源图，并确认页面没有因图片宽度产生横向滚动。

官方文档：[figure](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure) · [延迟加载](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)

### responsive | 不同屏幕选择不同图片

```html
<img
  src="./images/desk-800.jpg"
  srcset="./images/desk-400.jpg 400w, ./images/desk-800.jpg 800w"
  sizes="(max-width: 600px) 100vw, 600px"
  alt="笔记本放在窗边"
  width="800" height="600">
```

srcset 给浏览器候选资源及真实宽度；sizes 描述图片预计占据的布局宽度。浏览器结合设备像素比等因素选择文件，不保证每次窗口变化都重新下载。候选图片应表达同一内容并有一致比例。

需要不同裁剪构图时，可以进一步学习 picture。初学时先保证普通 img 的尺寸、路径和替代文字正确。

官方文档：[响应式图片](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)

### audio-video | 音视频与字幕

```html
<video controls width="640" preload="metadata">
  <source src="./media/demo.mp4" type="video/mp4">
  <track src="./media/demo-zh.vtt" kind="captions" srclang="zh" label="中文字幕" default>
  <p><a href="./media/demo.mp4">下载演示视频</a></p>
</video>
```

controls 提供播放控制，preload 是加载提示而不是严格保证。真实项目应提供可用字幕或文字说明，不强制自动播放带声音的内容。音频可使用 audio，基本结构类似。

示例引用的媒体文件需要你实际准备，只有标签不会生成视频或字幕。资源格式兼容性与文件大小也要在目标浏览器中验证。

官方文档：[video](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) · [track](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track)

## structure | 用语义组织页面

语义结构帮助读者、辅助技术和维护者理解区域用途。它不会自动决定页面外观。

### landmarks | header、main、footer 与 aside

```html
<body>
  <header>
    <p>学习笔记</p>
    <nav aria-label="主导航"><a href="./index.html">首页</a></nav>
  </header>
  <main id="main-content">
    <h1>今日学习</h1>
    <p>先完成一个可阅读的页面。</p>
  </main>
  <footer><p>学习练习项目</p></footer>
</body>
```

header 可以用于页面或文章的介绍区，footer 是对应区域的结尾信息，main 表示主要内容。页面中通常保留一个可见 main。aside 表示与主要内容相关但可独立的补充，例如相关阅读，而不是“所有放在右边的东西”。

官方文档：[组织文档](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents)

### sections | section、article 与 div 怎么选

article 适用于能独立分发或复用的内容，例如一篇文章或一条完整帖子。section 表示有主题的一组内容，通常应有标题。div 是没有额外语义的分组容器，适合纯布局需求。

```html
<section aria-labelledby="recent-title">
  <h2 id="recent-title">最近笔记</h2>
  <article>
    <h3><a href="./notes/html.html">认识 HTML</a></h3>
    <p>记录元素和属性的区别。</p>
  </article>
</section>
```

不必为了“语义化”把每个容器都改成 section。先问它是否确实是一个主题区域，以及标题是否表达了这个主题。

官方文档：[section](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/section) · [article](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/article) · [div](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/div)

### metadata | 页面标题、描述与资源连接

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="记录 HTML、CSS 和 JavaScript 的学习练习。">
  <title>今日学习 · 学习笔记</title>
  <link rel="stylesheet" href="./style.css">
  <script src="./app.js" defer></script>
</head>
```

description 简述页面内容，不能保证搜索引擎按原样展示。link 加载 CSS，defer 使这个外部经典脚本在文档解析后执行，并在多个 defer 脚本之间保持文档顺序。此时可以安全地查找正文中已解析的元素。

官方文档：[head 中的内容](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata) · [script](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)

### accessibility | 先用原生元素完成键盘操作

```html
<a class="skip-link" href="#main-content">跳到正文</a>
<button type="button">切换显示</button>
```

原生 button 已支持焦点、键盘激活和禁用状态；普通 div 不会自动获得这些行为。不要给 div 加一个点击事件就认为它与按钮等价。ARIA 用来补充语义，不能替你实现键盘逻辑。

练习：只用键盘从页面顶部走到正文中的链接和按钮，确认顺序与阅读顺序一致。不要用正数 tabindex 强行重排焦点。

官方文档：[HTML 与无障碍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)

## tables | 展示真正的表格数据

课程表、价格清单和对照数据适合表格。页面的左右布局应使用 CSS，而不是表格。

### basics | 行、单元格与表头

```html
<table>
  <caption>本周学习计划</caption>
  <thead>
    <tr><th scope="col">日期</th><th scope="col">内容</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">周一</th><td>HTML</td></tr>
    <tr><th scope="row">周二</th><td>CSS</td></tr>
  </tbody>
</table>
```

tr 是一行，th 是表头，td 是普通数据。caption 说明整张表。scope 表明表头对应一列还是一行，辅助技术因此更容易建立关系。

thead 和 tbody 组织区域，不会自动冻结表头或给表格添加边框。样式和滚动在 CSS 中处理。

官方文档：[HTML 表格基础](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_table_basics)

### spanning | 合并单元格要有数据依据

colspan 跨列，rowspan 跨行。跨越数量需要与实际网格对应，复杂合并会增加理解和无障碍关联的难度。初学阶段先画出每行有多少列，再写标签，不要靠空 td 反复试。

例如 `<td colspan="2">复习与练习</td>` 占据两列。只有数据本身存在合并关系时才使用；不要用它模拟整页的导航和卡片布局。

官方文档：[td 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/td) · [表格无障碍](https://www.w3.org/WAI/tutorials/tables/)

### exercise | 做一张可以在手机阅读的表

创建四行、三列的学习进度表，包含日期、主题和状态。给整表加 caption，给表头加 scope。缩窄窗口后观察是否溢出；在 CSS 教程中给外层容器加受控横向滚动，而不是把整个页面撑宽。

自查：如果把样式全部去掉，仍能判断每个数字对应哪一项吗？是否把表格用在真正二维的数据上？

官方文档：[表格进阶与无障碍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Table_accessibility)

## forms | 输入、表单与基本验证

表单收集输入。HTML 能描述控件和基本约束，但真正保存到服务器仍需要接口和服务端验证。

### labels | label、id 与 name

```html
<form action="/search" method="get">
  <label for="keyword">搜索笔记</label>
  <input id="keyword" name="q" type="search" placeholder="例如：盒模型">
  <button type="submit">搜索</button>
</form>
```

label 的 for 要等于控件 id，点击标签也能聚焦输入框。id 用于页面内关联，name 是提交时的字段名称，二者用途不同。placeholder 只是提示，输入后会消失，不能代替标签。

示例提交到 `/search?q=...`，需要服务器真的提供搜索功能。没有该接口时可以先观察地址变化，不要把跳转页面误认为完成了数据保存。

官方文档：[第一个表单](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Your_first_form) · [label](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)

### controls | 常用输入控件

```html
<label for="email">邮箱</label>
<input id="email" name="email" type="email" autocomplete="email">
<label for="message">留言</label>
<textarea id="message" name="message" rows="4"></textarea>
<label for="topic">主题</label>
<select id="topic" name="topic">
  <option value="html">HTML</option>
  <option value="css">CSS</option>
</select>
```

textarea 的初始文本放在开始和结束标签之间；select 通过 option 提供选项。checkbox 适合独立开关，radio 适合一组选一；同组 radio 使用相同 name、不同 value。

可以用 fieldset 和 legend 把相关控件组织成组。不要把电话号码简单当作数字计算，电话号码一般更适合 type=tel。

官方文档：[input 类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) · [fieldset](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset)

### validation | required、长度与按钮类型

```html
<form>
  <label for="task-title">学习任务</label>
  <input id="task-title" name="title" required maxlength="80">
  <button type="submit">添加</button>
  <button type="button">清空已完成</button>
</form>
```

required 要求非空，但输入一串空格仍可能需要 JavaScript 进一步 trim 检查。maxlength 限制长度。表单内的 button 应明确 type，避免本来想执行局部动作，却意外提交表单。

浏览器验证改善交互，不构成服务端可信依据。请求可以绕过页面直接发送，服务器仍需验证字段、权限和长度。

官方文档：[客户端表单验证](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)

### methods | GET、POST 与成功控件

GET 通常把字段编码在 URL 查询参数中，适合搜索和筛选；POST 把数据放在请求体中，但并不自动加密，传输仍应使用 HTTPS。不要用 URL 查询参数传密码等敏感内容。

控件需要 name 才会作为常规表单字段提交。未选中的 checkbox、禁用控件等通常不会包含在提交数据中。readonly 与 disabled 不同，前者通常仍会提交。

练习：创建一个带 name 的输入和一个不带 name 的输入，用 GET 提交到自己可观察的练习地址，比较 URL。不要在这个练习里输入真实个人资料。

官方文档：[发送表单数据](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data)

## project | 完成学习任务页的 HTML

这个页面将继续用于 CSS 和 JavaScript 教程。先让它在没有脚本时也能读懂结构；交互稍后实现。

### markup | 可以直接保存的完整结构

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="一个记录学习任务的练习页面。">
  <title>学习任务</title>
  <link rel="stylesheet" href="./style.css">
  <script src="./app.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header">
    <a class="brand" href="./index.html">学习任务</a>
    <nav aria-label="主导航"><a href="#tasks">任务列表</a></nav>
  </header>
  <main id="main" class="page">
    <h1>今天学什么</h1>
    <form id="task-form" class="task-form">
      <label for="task-title">新任务</label>
      <div class="input-row">
        <input id="task-title" name="title" maxlength="80" required autocomplete="off">
        <button type="submit">添加</button>
      </div>
    </form>
    <p id="task-status" role="status"></p>
    <section id="tasks" aria-labelledby="tasks-heading">
      <h2 id="tasks-heading">任务列表</h2>
      <ul id="task-list" class="task-list"></ul>
      <p id="empty-state">还没有任务。</p>
      <button id="clear-completed" type="button">清除已完成</button>
    </section>
    <noscript><p>添加与保存任务需要启用 JavaScript。</p></noscript>
  </main>
  <footer class="site-footer"><p>HTML · CSS · JavaScript 练习</p></footer>
</body>
</html>
```

把它保存到 index.html，同时建立空的 style.css 和 app.js，避免资源请求 404。当前按钮尚不能添加任务，这是下一门交互教程的工作，不应把“显示按钮”当作功能已完成。

官方文档：[HTML 元素参考](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements)

### audit | 逐项检查与常见错误

1. 浏览器标签页显示“学习任务”，正文只有一个 h1。
2. 点击“新任务”标签，输入框获得焦点；不输入内容直接提交，浏览器提示必填。
3. 使用 Tab 依次经过跳转链接、导航、输入和按钮，检查顺序。
4. 打开 Network，确认 HTML、CSS 和 JS 地址正确。空文件没有样式和交互是正常的。
5. 把窗口缩窄，记录需要 CSS 解决的间距、宽度和排版问题。

可以使用 HTML 检查工具定位重复 id、不正确嵌套或缺少属性。不要只依赖浏览器自动修复后的视觉结果。

官方工具：[W3C HTML 检查器](https://validator.w3.org/nu/)

### next | 在结构之上添加样式

现在你应能解释元素、属性、语义、路径和表单字段的区别。继续 [CSS 入门](/encyclopedia/css)，给这个页面设计尺寸、间距、颜色和响应式布局。之后再学习 [JavaScript](/encyclopedia/javascript)，实现任务的添加、完成、删除和保存。

练习：不用查资料，新增一个“使用说明”section，包含标题和三条列表；给它添加导航锚点，再用键盘验证可以到达。

官方文档：[MDN HTML 学习模块](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content)
