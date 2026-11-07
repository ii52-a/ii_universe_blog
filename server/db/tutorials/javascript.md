## start | 运行第一段 JavaScript

使用前两门教程的 index.html、style.css 和空 app.js。JavaScript 在这里负责读取输入、更新页面和保存学习任务。

### environment | 语言与浏览器提供的能力

JavaScript 语言本身包含变量、函数、对象和控制流程。document、fetch、localStorage 等由浏览器环境提供，并不是所有 JavaScript 运行环境都有相同接口。Node.js 也能运行 JavaScript，但默认没有网页的 document。

本教程主要在浏览器中运行。打开开发者工具的 Console，输入 `1 + 2`，应得到 3。控制台适合小实验；需要保留的程序应写在 app.js 中。

官方文档：[JavaScript 入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript) · [JavaScript 指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

### connect | 加载外部脚本

```html
<script src="./app.js" defer></script>
```

在 head 中保留这行，再在 app.js 写：

```js
console.log("脚本已经运行");
const heading = document.querySelector("h1");
console.log(heading);
```

保存刷新，Console 应显示文字和 h1 元素。defer 用于此处的外部经典脚本，保证脚本执行时文档已经解析。如果找不到输出，先查脚本请求是否 404，再查 Console 是否有语法错误。

不要把 script 标签写进 app.js，也不要用 CSS 的 link 标签加载脚本。

官方文档：[script 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)

### server | 为模块和请求启动本地服务器

纯脚本练习常能直接打开 HTML，但模块和 fetch 需要合适的 HTTP 环境。在项目根目录启动静态服务器；若已经安装 Python，可使用：

```sh
python -m http.server 8000
```

Windows 的 Python 启动器也可能使用 `py -m http.server 8000`。然后访问 `http://localhost:8000/`。终端应停留在该目录并持续运行，停止时按 Ctrl+C。不要从包含私人文件的上级目录启动并随意分享服务器地址。

没有 Python 时，可使用编辑器提供的可信本地预览服务。本教程不要求专门安装某个构建框架。

官方文档：[设置本地测试服务器](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/set_up_a_local_testing_server)

### errors | 读懂控制台错误

SyntaxError 常表示代码无法解析，例如缺少括号；ReferenceError 常表示使用了不存在的变量；TypeError 常表示某个值不支持当前操作，例如对 null 调用方法。错误位置是排查入口，真正原因可能在上一行或之前的赋值。

练习：故意把 querySelector 写错，观察错误；修复后再删掉一个括号。记录错误类型、文件名和行号。先解决第一个有效错误，再看后续错误是否仍存在。

官方文档：[JavaScript 错误参考](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors)

## values | 变量、值与类型

先认识数据，再编写改变数据的程序。把示例逐行放进 Console 或 app.js，预测结果后再运行。

### declarations | const、let 与赋值

```js
const course = "HTML";
let completed = 0;
completed = completed + 1;
console.log(course, completed); // HTML 1
```

const 声明的绑定不能重新赋值，let 可以。优先使用 const，只对确实需要重新赋值的变量用 let。变量名区分大小写，`taskTitle` 和 `tasktitle` 不是同一个名字。

赋值符号 `=` 把右侧结果放到左侧变量，并不表示数学方程。声明前使用 let 或 const 变量会出错。不要省略声明关键字，避免意外创建或修改全局变量。

官方文档：[语法与类型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)

### primitives | 字符串、数字、布尔值与空值

```js
const title = "学习 HTML";
const minutes = 25;
const done = false;
const selectedTask = null;
let response;
console.log(typeof title, typeof minutes, typeof done);
console.log(response); // undefined
```

字符串保存文本，number 保存常见数值，boolean 只有 true 和 false。null 常用于明确表示“没有对象”，undefined 常见于尚未赋值或不存在的属性。`typeof null` 的结果是 object，是语言的历史特性，不能据此认为 null 是可读取属性的对象。

数组和普通对象用于组织更多值，后续章节会详细介绍。入门时也应知道 bigint 和 symbol 存在，但不必立即用于这个任务页面。

官方文档：[数据类型与数据结构](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)

### strings | 模板字符串与常用文本操作

```js
const raw = "  学习 CSS  ";
const title = raw.trim();
console.log(title.length);
console.log(`今天的任务：${title}`);
console.log(title.includes("CSS")); // true
```

trim 去掉两端空白，不改变原字符串；模板字符串使用反引号，`${...}` 中可以放表达式。length 按 UTF-16 码元计数，不总等于人眼看到的字符数量，某些 emoji 会占多个单位。

练习：对输入“只有空格”的字符串先 trim，再检查是否为空。页面判断任务标题时就会用到这个步骤。

官方文档：[字符串](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) · [模板字符串](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

### numbers | 显式转换与无效数字

```js
const text = "25";
console.log(text + 5); // "255"
console.log(Number(text) + 5); // 30
console.log(Number("abc")); // NaN
console.log(Number.isNaN(Number("abc"))); // true
```

加号可能进行字符串拼接。表单 input.value 通常是字符串，即使 input 的 type 是 number 也要注意读取方式。Number("") 会得到 0，因此判断用户是否真的输入数字，应先检查去掉空白后的内容，再转换并验证。

普通浮点数存在精度限制，例如 0.1 + 0.2 不会精确等于 0.3。不要为了让显示好看就把字符串格式化与数值计算混在一起。

官方文档：[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) · [Number.isNaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)

## operators | 比较、逻辑与表达式

表达式产生一个值。把比较结果写进 console.log，是理解条件判断的直接办法。

### comparison | 等号与严格比较

```js
console.log(3 === 3); // true
console.log(3 === "3"); // false
console.log(3 !== "3"); // true
console.log(8 >= 5); // true
```

入门代码优先使用严格相等 === 和严格不等 !==，避免 == 带来的隐式转换。不要把赋值 `done = true` 写进本来想比较的条件。

对象比较的是身份，不是自动逐项比较内容。`{} === {}` 为 false；同一个对象赋给两个变量后，它们可以严格相等。

官方文档：[相等比较](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)

### truth | 真值、逻辑与空值合并

```js
const title = "";
console.log(Boolean(title)); // false
console.log(Boolean([])); // true
const savedCount = 0;
console.log(savedCount || 10); // 10
console.log(savedCount ?? 10); // 0
```

空字符串、0、NaN、null、undefined 和 false 等在布尔上下文中是假值；空数组和空对象是真值。&& 与 || 返回某个操作数，不保证返回布尔值。?? 只在左侧是 null 或 undefined 时选择右侧，适合保留 0 或空字符串这样的有效值。

练习：分别预测 `"0"`、`"false"` 和空格字符串的真假。它们都是非空字符串。

官方文档：[逻辑运算符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators) · [空值合并](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

### optional | 可选链与短表达式

```js
const selected = null;
console.log(selected?.title); // undefined
const name = selected?.title ?? "未选择任务";
console.log(name);
```

可选链在对应位置为 null 或 undefined 时停止访问，适合可选数据。它不能替代必需元素的错误检查，也不能修复一个根本没有声明的变量。

三元表达式 `done ? "已完成" : "未完成"` 适合简单的二选一。条件复杂时写 if，比连续嵌套多个三元表达式更容易检查。

官方文档：[可选链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

## control | 条件、循环与提前返回

控制流程决定程序在什么条件下执行哪些语句。先用少量数据验证每个分支。

### branches | if 与分支顺序

```js
const title = "  ".trim();
if (title.length === 0) {
  console.log("请填写任务");
} else if (title.length > 80) {
  console.log("任务最多 80 个码元");
} else {
  console.log("可以添加");
}
```

从上到下，命中一个分支后就不再执行后面的 else if。边界条件要单独验证，例如长度为 0、1、80、81。给每个分支保留花括号，可以减少新增语句时的误解。

官方文档：[控制流](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)

### loops | 遍历数组与计数循环

```js
const topics = ["HTML", "CSS", "JavaScript"];
for (const topic of topics) {
  console.log(topic);
}
for (let index = 0; index < topics.length; index++) {
  console.log(index, topics[index]);
}
```

数组下标从 0 开始，最后一个下标是 length - 1。for...of 读取值；需要位置时使用普通 for 或 entries。for...in 遍历属性名，不是这个场景的首选数组遍历方式。

练习：把条件误写为 `index <= topics.length`，观察最后为什么出现 undefined，再修正为小于。

官方文档：[循环与迭代](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)

### exits | break、continue 与避免无限循环

break 结束当前循环；continue 跳过这次循环剩余部分，进入下一轮。while 循环必须有能够改变条件的步骤，否则可能持续占用主线程，让页面无法响应。

```js
for (const topic of ["HTML", "", "CSS"]) {
  if (topic === "") continue;
  console.log(topic);
}
```

不要在页面主线程中用空循环等待网络结果或等待一秒钟。需要延迟和网络通信时，后面的异步章节会使用计时器与 Promise。

官方文档：[break](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break) · [continue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/continue)

## functions | 函数、作用域与回调

函数把一个操作命名，并通过参数接收输入、通过返回值提供结果。

### parameters | 定义、调用与返回值

```js
function normalizeTitle(value) {
  return value.trim();
}
const result = normalizeTitle("  阅读文档  ");
console.log(result); // 阅读文档
```

定义函数时不会自动执行其中的代码，调用时才执行。value 是参数，传入的字符串是实参。return 结束这次调用并返回值；没有显式 return 时通常返回 undefined。console.log 只是输出，不等于返回。

练习：写一个 isValidTitle，输入文本，返回去掉两端空白后长度是否在 1 到 80 之间。分别测试空白、正常和过长文本。

官方文档：[函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)

### scope | 局部变量与闭包

```js
function createCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}
const next = createCounter();
console.log(next()); // 1
console.log(next()); // 2
```

内部函数保留对外层词法环境的访问，这称为闭包。不同次 createCounter 调用会建立不同环境。let 与 const 还具有块作用域，在 if 或 for 的花括号内声明后，不能随意在外部访问。

初学项目不需要把所有函数都嵌套起来；只有确实需要封装状态时再使用这种模式。

官方文档：[闭包](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

### callbacks | 箭头函数与传递函数

```js
const double = number => number * 2;
console.log([1, 2, 3].map(double)); // [2, 4, 6]
const titles = ["HTML", "CSS"].map(title => `学习 ${title}`);
```

把函数作为参数传给另一个函数，就是回调的常见用法。`map(double)` 传入函数，`map(double())` 则先调用 double，把它的返回值传进去，这通常不是你要的结果。

箭头函数的 this 行为与普通函数不同，不应把它视为完全等价的简写。单表达式可省略 return，花括号函数体需要显式 return 才会返回指定结果。

官方文档：[箭头函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

### guards | 提前返回让流程更清楚

```js
function getMessage(raw) {
  const title = raw.trim();
  if (!title) return "请填写任务";
  if (title.length > 80) return "任务太长";
  return `已添加：${title}`;
}
```

先处理无效输入，正常逻辑就不必层层嵌套。每个 return 后的同一路径代码不会继续执行。把“校验”“更新数据”“更新页面”分成明确步骤，比写一个很长的点击函数更容易排错。

官方文档：[return](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return)

## collections | 数组、对象与数据更新

任务不是只有一段文字。每条任务还需要稳定标识和完成状态，用对象描述；多条任务用数组组织。

### objects | 描述一条任务

```js
const task = { id: "task-1", title: "学习 HTML", done: false };
console.log(task.title);
task.done = true;
console.log(task["done"]); // true
```

const 阻止变量重新指向另一个值，不会自动冻结对象属性。属性名固定时常用点语法，属性名来自变量时用方括号，例如 task[field]。

同一对象赋给另一个变量后，两者仍指向同一个对象。展开语法 `{ ...task }` 只做浅拷贝，嵌套对象仍可能共享引用。

官方文档：[使用对象](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)

### arrays | 增删、查找与变换

```js
const tasks = [
  { id: "a", title: "HTML", done: true },
  { id: "b", title: "CSS", done: false }
];
console.log(tasks.find(task => task.id === "b"));
console.log(tasks.filter(task => !task.done));
console.log(tasks.map(task => task.title));
console.log(tasks.some(task => task.done));
```

find 找到第一项，否则返回 undefined；filter 返回满足条件的新数组；map 为每一项生成结果；some 判断是否至少有一项满足条件。filter 和 map 不直接修改原数组，但回调里如果改了对象属性，仍可能影响共享对象。

push、splice 和 sort 等方法会修改数组。使用前先确认你希望原地修改还是得到新数组。

官方文档：[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

### identity | 使用稳定 id 而不是显示文字

两条任务可以都叫“复习 HTML”，因此不能用标题作为唯一标识。数组下标在删除后会变化，也不适合长期标记某条任务。浏览器的安全上下文中可以使用 `crypto.randomUUID()` 生成标识；localhost 通常满足本地开发条件。

删除指定 id 的任务可写 `tasks = tasks.filter(task => task.id !== targetId)`。如果 tasks 需要重新赋值，应使用 let 声明。更新对象可用 map 返回新对象，也可在受控的小项目中明确修改目标属性，关键是保持数据和页面一致。

官方文档：[crypto.randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)

### serialization | JSON 与数据检查

```js
const text = JSON.stringify([{ title: "HTML", done: false }]);
const value = JSON.parse(text);
console.log(Array.isArray(value)); // true
```

JSON 是数据格式，不会保存函数，也不能无损表达所有 JavaScript 值。parse 遇到无效文本会抛错。数据能够解析，并不说明它具有你期待的字段；仍需检查是否是数组、title 是否是字符串、done 是否是布尔值。

练习：把对象写成字符串后再解析，比较对象身份；再尝试解析一个缺少引号的对象文本，用 try/catch 捕获错误。

官方文档：[JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)

## dom | 查找与更新页面

DOM 是浏览器把文档组织成的对象树。页面文字不会因为数组变化而自动更新，需要你明确修改 DOM。

### query | 查找元素并检查是否存在

```js
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
const list = document.querySelector("#task-list");
if (!form || !input || !list) {
  throw new Error("页面缺少任务控件，请核对 HTML 中的 id");
}
```

querySelector 使用 CSS 选择器，返回第一个匹配元素或 null。querySelectorAll 返回一组匹配结果。若希望找 class，使用点号；找 id，使用井号。

页面缺少必要控件时，应修正结构或加载顺序，而不是到处加可选链让错误被吞掉。练习：故意改错一个 id，确认错误信息能指出问题。

官方文档：[querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)

### text | 文字、表单值与类名

```js
const status = document.querySelector("#task-status");
status.textContent = "已添加一条任务";
const input = document.querySelector("#task-title");
console.log(input.value);
status.classList.toggle("has-message", true);
```

普通文字使用 textContent，输入框使用 value。classList 可以添加、删除或切换类，CSS 再根据这些类呈现状态。输入框的 value 属性值和 HTML 中最初写的 value 特性并非始终相同。

不要用 innerHTML 拼接未经处理的用户输入。用户输入 `<img ...>` 时，我们希望显示它的文字，而不是让浏览器把它解析成新元素。

官方文档：[textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) · [classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)

### create | 创建节点并加入页面

```js
const item = document.createElement("li");
item.className = "task-item";
const title = document.createElement("span");
title.className = "task-title";
title.textContent = "学习 DOM";
item.append(title);
document.querySelector("#task-list").append(item);
```

createElement 创建节点，但不会自动显示；append 把它接入树。remove 删除节点，replaceChildren 替换某容器的子节点。需要一次生成多项时，可以先放进 DocumentFragment，再整体插入。

重新创建列表可能使当前输入或焦点丢失，因此更新后要考虑用户操作位置。最后的项目会恢复被切换任务的焦点。

官方文档：[createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) · [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)

### render | 数据是来源，DOM 是呈现

```js
function renderTitles(tasks, list) {
  const fragment = document.createDocumentFragment();
  for (const task of tasks) {
    const item = document.createElement("li");
    item.textContent = task.title;
    fragment.append(item);
  }
  list.replaceChildren(fragment);
}
```

先更新 tasks，再调用 render，比同时把一部分状态放在数组、一部分只放在 DOM 属性里更容易维护。render 应根据当前数据产生一致结果，不应每次渲染就重复注册全局事件。

练习：连续调用两次 renderTitles，列表数量应保持正确，而不是翻倍。

官方文档：[replaceChildren](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceChildren)

## events | 处理点击、输入与提交

事件把用户操作连接到函数。表单提交、按钮点击和输入变化是不同事件，选择与目的相符的入口。

### listeners | 监听器与事件对象

```js
const button = document.querySelector("#clear-completed");
button.addEventListener("click", event => {
  console.log(event.type); // click
  console.log(event.currentTarget); // 注册监听器的按钮
});
```

传给 addEventListener 的是函数，而不是先执行这个函数。event.target 是事件实际起点，currentTarget 是当前监听器所在元素。点击按钮内部图标时，target 可能是图标。

需要移除监听器时，应保留同一个函数引用再调用 removeEventListener；重新写一个外观相同的箭头函数不是同一个引用。

官方文档：[addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)

### submit | 用表单提交处理添加任务

```js
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
form.addEventListener("submit", event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  console.log("准备添加：", title);
  form.reset();
  input.focus();
});
```

监听 submit 可以同时处理点击提交按钮和输入框按 Enter。preventDefault 阻止这次提交的默认导航，不等于阻止事件冒泡，也不代替字段验证。required 的原生验证通常会先拦住不合要求的提交。

官方文档：[submit 事件](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) · [preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)

### delegation | 让动态任务共用监听器

```js
const list = document.querySelector("#task-list");
list.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-remove]");
  if (!button || !list.contains(button)) return;
  console.log("删除任务：", button.dataset.remove);
});
```

许多事件会冒泡到祖先，所以可以在列表注册一次监听，处理后来生成的按钮。closest 允许用户点击按钮里的子元素。需要区分“点了哪里”和“这个操作属于哪条任务”。

给删除按钮设置 data-remove 保存任务 id，显示文字可以重复，但操作身份保持稳定。

官方文档：[事件冒泡](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling) · [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

### keyboard | 反馈、焦点与默认控件

优先使用原生 button、input 和 form，让 Enter、Space 和 Tab 按预期工作。添加后把焦点放回输入框；删除当前任务后把焦点放到邻近任务或输入框；不要每次更新都把用户送回页面顶部。

HTML 中的 `<p id="task-status" role="status"></p>` 可用于发布“已添加”“无法保存”等简短结果。不要在每次按键时反复播报整份列表，也不要只依赖颜色表示成功或失败。

官方文档：[键盘无障碍](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard) · [status 角色](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)

## async | Promise、请求与错误处理

网络请求需要等待，等待时页面仍应响应输入。异步并不意味着所有代码都自动并行执行。

### promises | 先理解执行顺序

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// 这个示例通常依次输出 A、D、C、B。
```

同步代码先完成，Promise 回调通过微任务执行，计时器回调在后续任务中执行。0 毫秒表示最早可以安排，不保证立刻发生。长时间同步循环仍会阻塞页面。

Promise 表示未来的完成或失败。async 函数返回 Promise，await 暂停该函数后续流程，等待结果，不是把整个浏览器冻结。

官方文档：[使用 Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) · [执行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)

### fetch | 发起请求并检查响应

先在项目中创建 `data/notes.json`，内容为 `[{"title":"学习 fetch"}]`，并通过本地 HTTP 服务器访问页面：

```js
async function loadNotes() {
  const response = await fetch("./data/notes.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const notes = await response.json();
  if (!Array.isArray(notes)) throw new Error("返回数据不是数组");
  return notes;
}
```

fetch 收到 404 或 500 响应时通常仍会兑现 Promise，所以要检查 response.ok。读取 JSON 也是异步操作，还可能因为返回 HTML 或无效 JSON 而失败。数据来自服务器并不代表字段一定符合预期。

官方文档：[使用 Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

### failures | 加载中、成功与失败都要处理

```js
async function showNotes() {
  const status = document.querySelector("#task-status");
  status.textContent = "正在读取笔记…";
  try {
    const notes = await loadNotes();
    status.textContent = `读取到 ${notes.length} 条笔记`;
  } catch (error) {
    status.textContent = "读取失败，请检查路径与服务器。";
    console.error(error);
  }
}
```

修改文件名制造一次 404，再把 JSON 写错制造一次解析失败，确认页面都有反馈。不要 catch 后什么都不做，否则用户只会看到空白。

跨域请求能否读取响应，由目标服务器的 CORS 策略决定。`mode:"no-cors"` 不会让你获得正常可读取的 JSON 响应，不是绕过策略的修复方式。

官方文档：[try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) · [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

### cancellation | 取消过期请求与避免结果覆盖

```js
let controller;
async function refreshNotes() {
  controller?.abort();
  controller = new AbortController();
  try {
    const response = await fetch("./data/notes.json", { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(await response.json());
  } catch (error) {
    if (error.name !== "AbortError") console.error(error);
  }
}
```

用户连续搜索时，较早请求可能更晚返回。取消过期请求或比较请求标识，可以防止旧结果覆盖新结果。取消后应区分“主动放弃”与“真正失败”，不要对每次正常取消都弹错误。

官方文档：[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

## storage | 本地保存与读取

localStorage 可以让同一来源的网站在刷新后读回少量字符串数据。它不是账号云同步，也不是服务器数据库。

### basics | 把数组保存成字符串

```js
const key = "learning-tasks.v1";
const tasks = [{ id: "a", title: "学习 HTML", done: false }];
localStorage.setItem(key, JSON.stringify(tasks));
const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
console.log(saved);
```

同一协议、主机和端口组成的来源共享对应存储；换端口可能看到另一份数据。隐私模式、权限、配额或用户清理都会影响它。不要把长期登录凭据等秘密放在这个教学存储中。

官方文档：[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### validate | 读取时验证结构

```js
function isTask(value) {
  return value !== null && typeof value === "object"
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.done === "boolean";
}
```

用户、扩展或旧版本代码都可能改变存储值。parse 只保证 JSON 语法可解析，不保证数组、字段和长度。读取时检查类型，限制条数和标题长度，处理重复 id，避免把异常值直接传给 DOM 操作。

练习：在开发者工具的 Storage 或 Application 面板把值改成 `{}`，再刷新，确认程序不会直接崩溃。

官方文档：[Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### errors | 保存失败也要保持可操作

把 getItem、parse 和 setItem 放在对应 try/catch 中。读取失败时给出说明并使用受控初始状态；保存失败时，当前页面的内存数据仍可以继续操作，但要告诉用户刷新后可能丢失。

删除练习数据应使用 `localStorage.removeItem("learning-tasks.v1")`，避免直接 clear 清空同一来源下其他功能的数据。不要在每次加载时先写空数组，那会覆盖之前保存的任务。

官方文档：[Storage 接口](https://developer.mozilla.org/en-US/docs/Web/API/Storage)

## modules | 拆分文件与调试程序

当一个文件开始同时处理数据、请求和页面时，可以按职责拆分。先让小项目运行正确，再拆分，而不是一开始就建立很多空目录。

### imports | export 与 import

```js
// utils.js
export function normalizeTitle(value) {
  return value.trim();
}
```

```js
// app.js
import { normalizeTitle } from "./utils.js";
console.log(normalizeTitle("  HTML  "));
```

此时 HTML 改为 `<script type="module" src="./app.js"></script>`。模块默认延后执行，并使用严格模式；相对导入路径要包含正确扩展名，通过 HTTP 服务器访问。浏览器不会自动把 `import "某个包名"` 解析成 node_modules，除非另有导入映射或构建工具。

官方文档：[JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### debug | 断点、调用栈与最小复现

在开发者工具 Sources 中找到 app.js，在事件处理函数某行设置断点，触发操作。暂停后查看变量值、调用栈，逐步执行。先确认函数是否运行，再确认数据是否正确，最后检查 render 是否更新页面。

遇到问题把它缩小：先只保留一条任务、一个按钮和一个监听器。不要一次修改数据模型、选择器和样式后再猜哪一项修好了。

官方文档：[JavaScript 调试](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_went_wrong)

### boundaries | 什么时候需要框架与后端

当前任务页只在同一个浏览器来源中保存数据。需要跨设备、账号权限和多人共享时，应由后端接口与数据库承担数据持久化和授权。把数据库密码写进浏览器脚本并不能安全连接数据库。

框架可以帮助组织复杂界面，但不会替你理解变量、事件、异步和数据验证。先完成下面这个不依赖框架的小项目，再决定下一步工具。

官方文档：[客户端与服务端](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview)

## project | 完成可保存的学习任务页

使用 HTML 教程最后一章的结构和 CSS 教程的样式。以下 app.js 是完整的经典脚本，不需要与前面零散示例拼接；保留 HTML 中带 defer 的 script，直接替换 app.js 内容。

### complete | 完整可运行代码

```js
"use strict";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
const list = document.querySelector("#task-list");
const status = document.querySelector("#task-status");
const empty = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-completed");
if (!form || !input || !list || !status || !empty || !clearButton) {
  throw new Error("缺少任务控件，请使用 HTML 教程中的完整结构");
}

const STORAGE_KEY = "learning-tasks.v1";
let storageWarning = "";

function loadTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) throw new Error("存储内容不是数组");
    const ids = new Set();
    return parsed.filter(task => {
      if (!task || typeof task !== "object") return false;
      if (typeof task.id !== "string" || !task.id || task.id.length > 80 || ids.has(task.id)) return false;
      if (typeof task.title !== "string" || !task.title.trim() || task.title.length > 80) return false;
      if (typeof task.done !== "boolean") return false;
      ids.add(task.id);
      return true;
    }).slice(0, 200).map(task => ({ id: task.id, title: task.title.trim(), done: task.done }));
  } catch (error) {
    console.error(error);
    storageWarning = "未能读取本地记录，请检查浏览器存储设置。";
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageWarning = "";
  } catch (error) {
    console.error(error);
    storageWarning = "未能保存到本地，刷新后本次改动可能丢失。";
  }
}

function render(focusId = null) {
  const fragment = document.createDocumentFragment();
  let focusTarget = null;
  for (const task of tasks) {
    const item = document.createElement("li");
    item.className = "task-item";
    item.classList.toggle("is-done", task.done);

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.id = task.id;
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    label.append(checkbox, title);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-task";
    remove.dataset.remove = task.id;
    remove.textContent = "删除";
    remove.setAttribute("aria-label", `删除任务：${task.title}`);
    item.append(label, remove);
    fragment.append(item);
    if (task.id === focusId) focusTarget = checkbox;
  }
  list.replaceChildren(fragment);
  empty.hidden = tasks.length > 0;
  clearButton.disabled = !tasks.some(task => task.done);
  if (focusTarget) focusTarget.focus();
}

function commit(message, focusId = null) {
  saveTasks();
  render(focusId);
  status.textContent = storageWarning || message;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title || title.length > 80) {
    status.textContent = "请填写 1 到 80 个码元的任务标题。";
    input.focus();
    return;
  }
  if (tasks.length >= 200) {
    status.textContent = "练习列表最多保存 200 条任务，请先整理。";
    return;
  }
  tasks.push({ id: crypto.randomUUID(), title, done: false });
  commit(`已添加：${title}`);
  form.reset();
  input.focus();
});

list.addEventListener("change", event => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
  const task = tasks.find(item => item.id === checkbox.dataset.id);
  if (!task) return;
  task.done = checkbox.checked;
  commit(task.done ? "任务已完成" : "任务恢复为未完成", task.id);
});

list.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-remove]");
  if (!button || !list.contains(button)) return;
  const index = tasks.findIndex(task => task.id === button.dataset.remove);
  if (index < 0) return;
  const focusId = tasks[index + 1]?.id ?? tasks[index - 1]?.id ?? null;
  tasks = tasks.filter(task => task.id !== button.dataset.remove);
  commit("任务已删除", focusId);
  if (!focusId) input.focus();
});

clearButton.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.done);
  commit("已清除完成的任务");
  input.focus();
});

render();
status.textContent = storageWarning;
```

代码分成读取、保存、渲染、提交变化和事件处理五部分。输入通过 textContent 显示，重复标题通过不同 id 区分；更新完成状态后恢复复选框焦点。示例限制了数据规模，没有账号和服务器同步。

官方文档：[DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) · [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### acceptance | 按功能逐项验收

1. 添加“学习 HTML”，确认列表出现一条，输入框清空并仍有焦点。
2. 输入纯空格，确认不会新增；正常空输入由 required 拦住。
3. 连续添加两条同名任务，只删除其中一条，另一条仍存在。
4. 勾选任务，确认文字划线；刷新页面，完成状态和内容仍保留。
5. 输入 `<b>这只是文字</b>`，确认页面显示文字，没有生成粗体标签。
6. 清除已完成，只移除勾选项；列表为空时出现空状态提示。
7. 在开发者工具把存储改为无效 JSON，再刷新，确认页面给出反馈且仍可添加。
8. 只用键盘完成添加、勾选和删除，观察焦点是否保留在合理位置。

官方文档：[浏览器开发者工具](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools)

### extend | 有顺序地增加功能

先添加“全部 / 未完成 / 已完成”筛选：保留原 tasks，仅在渲染前过滤，不要把筛选结果覆盖原数组。再添加计数，用 filter 计算未完成数量。最后尝试编辑任务，明确保存和取消行为。

每增加一个功能，重新执行上面的验收。把代码提交到练习仓库，写 README 和已知限制，再按 [GitHub Pages 教程](/encyclopedia/github/pages) 发布。以后接数据库时，保留这些数据校验和交互检查，并把授权放到服务器。

官方文档：[MDN JavaScript 学习模块](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting)
