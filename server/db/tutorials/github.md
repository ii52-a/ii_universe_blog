## start | 从零认识 GitHub

完成本章后，你能区分 Git、GitHub 和仓库，并在浏览器中完成一次“新建分支 → 修改文件 → 提交 → 合并”。不要求先安装软件或学会编程。

### repository | 文件夹、仓库与版本历史

假设电脑里有一个 `learning-notes` 文件夹，里面放着学习笔记。普通文件夹保存当前文件；Git 仓库还保存提交历史，能回答“谁在什么时候改了什么”。GitHub 则把远程仓库放在服务器上，提供网页浏览、权限控制、问题讨论和代码审查。

一个 GitHub 仓库地址通常写成 `https://github.com/用户名/仓库名`。用户名是仓库所有者，也可能是组织名。`README.md` 是项目说明，页面上的文件列表是某个分支目前的内容。仓库不只用来放程序，也可以放课程笔记、网页或文档。

本地仓库和远程仓库是两个副本。修改本地文件不会立刻出现在 GitHub；需要先提交，再推送。网页编辑则直接在远程仓库产生提交。先记住这条顺序，后面的命令都围绕它展开。

官方文档：[关于仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)

### vocabulary | 先读懂界面上的词

| 名称 | 含义 | 例子 |
| --- | --- | --- |
| Repository / Repo | 一个项目的文件与历史 | `alice/learning-notes` |
| Commit | 一次带说明的版本记录 | “补充 CSS 盒模型笔记” |
| Branch | 指向一条开发线的名称 | `main`、`docs/intro` |
| Remote | 远程仓库地址的别名 | 克隆来源通常叫 `origin` |
| Clone | 获取文件、历史和分支信息 | 在电脑上继续开发 |
| Fork | 在自己账号下创建仓库副本 | 向别人的项目贡献代码 |
| Pull request / PR | 请求审查并合并分支上的修改 | 把 `docs/intro` 合入 `main` |
| Issue | 问题、需求和任务讨论 | 报告一个可复现的错误 |
| Release | 项目作者发布的版本说明及附件 | 下载对应系统的安装包 |
| Star | 标记感兴趣的仓库 | 方便之后找回 |

Commit 不是“上传按钮”；它可以在离线时完成。PR 也不是下载请求，而是协作中的合并提议。

官方文档：[GitHub 术语表](https://docs.github.com/en/get-started/learning-about-github/github-glossary)

### account | 账号与第一个练习仓库

1. 在 GitHub 注册并验证邮箱，保存恢复账号所需的信息，按提示设置双重身份验证。
2. 使用创建仓库入口，把名称设为 `learning-notes`。名称中尽量使用字母、数字和短横线。
3. 选择公开或私有，勾选添加 README，然后创建。首次练习可使用私有仓库。
4. 仓库首页应出现 `README.md` 和一次初始提交。记下页面地址。

公开表示他人能浏览；是否允许复制、修改和分发由许可证决定。练习仓库不需要填入密码、令牌、家庭住址等资料。仓库名称和描述以后都可以修改。

官方文档：[创建仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) · [保护账号](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/about-two-factor-authentication)

### practice | 不用命令行完成第一次协作流程

打开分支选择器，从默认分支新建 `docs/hello`。在这个分支中编辑 README，加入 `今天开始学习 GitHub。`，填写提交说明“添加学习目标”，完成提交。

然后创建 PR：目标分支选择默认分支，来源选择 `docs/hello`。在 Files changed 中确认只增加了一行，写明修改目的，再合并。切回默认分支，你应看到新文字。分支名不是固定要求，默认分支也不一定叫 `main`，以仓库实际名称为准。

**检查理解：**修改后只保存到编辑器，没有提交，Git 历史会出现它吗？不会。创建 PR 后没有合并，默认分支会变化吗？也不会。

官方文档：[Hello World 完整练习](https://docs.github.com/en/get-started/using-github/hello-world)

### markdown | 下一步阅读 Markdown

GitHub 的 README、Issue 和 PR 描述经常使用 Markdown。它是纯文本格式，用少量符号表示标题、列表、链接和代码。下一章会用一个完整 README 逐项练习。暂时只需认识：`# 标题`、`**重点**` 和反引号包围的代码。

官方文档：[在 GitHub 上编写内容](https://docs.github.com/en/get-started/writing-on-github)

## markdown | Markdown 与 README 写作

本章在练习仓库的 README 中操作。每增加一种格式，都先看 Preview，再提交；不要一次粘贴整篇后才排查问题。

### text | 标题、段落与强调

```markdown
# 我的学习笔记

这份笔记记录 HTML、CSS 和 JavaScript 的练习。

## 如何阅读

先读 **HTML**，再做 CSS 练习。
遇到不认识的命令，先看说明，再执行。
```

`#` 后需要空格，数量表示标题级别。整篇通常有一个一级标题；二级标题表示并列章节，三级标题表示章节中的小节。段落之间空一行，源码里的普通换行不一定变成显示换行。确实需要强制换行时，可在行末放两个空格；较长说明更适合拆成段落。

`**文字**` 表示强调，单个反引号表示短代码，例如 `git status`。不要用加粗冒充标题，否则目录和阅读结构都不清楚。

官方文档：[基本书写和格式语法](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

### lists | 列表、待办与引用

```markdown
## 学习顺序

1. 创建网页文件
2. 添加样式
3. 编写交互

## 本周待办

- [x] 建立仓库
- [ ] 完成第一个页面
- [ ] 写运行说明

> 这段引用记录一条需要保留的原话。
```

有先后关系用编号列表，并列内容用短横线。任务框需要保持 `- [ ]` 的空格。嵌套列表要缩进到父项内容位置，并在预览中确认层级。引用适合引用内容，不要把所有提示都变成引用框。

练习：把一个任务标为完成，再查看提交差异。你应该只看到 `[ ]` 变成 `[x]`。

官方文档：[列表和任务列表](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

### links | 相对链接、图片与表格

```markdown
[打开 HTML 笔记](notes/html.md)
[GitHub 文档](https://docs.github.com/)
![页面截图，展示标题和三张笔记卡片](images/home.png)

| 文件 | 用途 |
| --- | --- |
| index.html | 网页结构 |
| style.css | 网页样式 |
```

相对链接从当前 Markdown 文件所在目录计算。README 在仓库根目录时，`images/home.png` 指向根目录中的 images 文件夹。不要填写 `C:\Users\你的名字\Desktop\截图.png`，其他人的电脑没有这个路径。文件名大小写应一致。

图片的方括号写内容说明，而不是只写“图片”。表格表头后必须有分隔行；单元格中需要竖线时使用 `\|`。

官方文档：[相对链接与图片](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) · [创建表格](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables)

### code | 展示代码与常见排版错误

````markdown
```html
<h1>我的笔记</h1>
```

```sh
git status
```
````

三个反引号开启和结束代码块，开始处可填写语言名。展示“代码块本身”时，外层围栏要比内层长，示例源码因此可以包含三反引号。行内代码里有反引号时，也可以改用更长的围栏。

排版出错时先检查：是否少了闭合围栏、标题后是否缺空格、表格是否缺分隔行、嵌套列表是否缩进错误。Markdown 文件要保存为 UTF-8，扩展名是 `.md`，不是 `.md.txt`。

官方文档：[创建代码块](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks)

### readme | 写一份别人能照着使用的 README

README 至少回答五个问题：这个项目做什么，需要什么环境，怎样启动，怎样使用，在哪里反馈问题。一个尚未写程序的练习仓库，也可以说明学习目标、目录结构和当前进度。

````markdown
# 浏览器笔记本

在浏览器中添加、完成和保存学习任务。

## 运行

用本地静态服务器打开项目根目录，访问终端给出的地址。

## 文件

- index.html：结构
- style.css：样式
- app.js：交互

## 验证

添加一条任务，刷新页面，确认任务仍然存在。
````

练习：找一位没看过代码的人，只给他 README，观察他在哪一步停下。把缺失步骤补进去。截图和徽章可以辅助说明，但不能替代运行步骤。

官方文档：[关于 README](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)

## browse | 阅读、搜索与下载项目

下载之前，先确认自己需要的是应用程序、源代码，还是一份学习材料。

### read | 按顺序读仓库首页

先看 README 的用途和运行要求，再看文件结构、许可证、最近提交和 Issues。`package.json` 往往意味着 JavaScript 项目，`pyproject.toml` 常见于 Python 项目，但最终应以 README 为准。

查看最近提交可以了解维护活动；Issue 数量本身不能直接说明项目质量。进入一个文件后，可以查看 History 了解改动，也可以用 Blame 查看某行附近的提交来源。Blame 是理解原因的入口，适合继续阅读对应提交和讨论。

练习：挑一个项目，用自己的话记录用途、启动命令、许可证、反馈位置。找不到运行要求时，先记录疑问，不要猜着执行一串命令。

官方文档：[探索仓库](https://docs.github.com/en/repositories)

### search | 用搜索限定语言和用途

在搜索框输入 `todo language:JavaScript stars:>100 archived:false`，它会把关键词和筛选条件组合起来。星标数量只帮助缩小范围，并不代表安全、正确或适合你。

仓库搜索、代码搜索和 Issue 搜索是不同入口。查项目用仓库搜索；查函数名或文件内容用代码搜索；查报错时先在项目的 Issues 中搜索关键词。阅读结果时对照版本号，旧问题的解决方式可能已经不适用。

练习：分别搜索一个功能、一个准确报错和一个文件名。记录哪种搜索入口更快找到结果。

官方文档：[搜索仓库](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories) · [代码搜索语法](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax)

### download | ZIP、Clone 和 Release 的区别

| 方式 | 得到什么 | 适合什么时候 |
| --- | --- | --- |
| Download ZIP | 指定分支的一份文件快照，没有完整 Git 历史 | 只查看代码或材料 |
| Clone | 本地 Git 仓库及其历史信息 | 修改、同步和贡献代码 |
| Release 附件 | 作者额外上传的发布文件 | 安装应用或下载构建产物 |

Release 页面自动提供的 Source code 仍然是源码归档，不等于已经编译好的应用。安装包需匹配系统与架构，例如 Windows、macOS、Linux，以及 x64 或 arm64。执行文件前，应确认来源和项目说明。

官方文档：[下载文件](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-files-from-github) · [克隆仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)

### licenses | 许可证、依赖与提问前检查

公开仓库能被看到，不等于作者放弃版权。复用时阅读 LICENSE，并确认你使用的代码、图片、字体是否分别有许可。没有许可证时，不要自动假定允许自由分发。

如果项目要求安装依赖，先阅读锁文件和包管理器说明。不要把 README 中互相替代的 npm、pnpm、yarn 命令全部执行一遍。遇到失败，记录系统、运行时版本、实际命令和完整错误，再判断是网络、环境还是代码问题。

官方文档：[为仓库添加许可证](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

## files | 仓库中的基本文件

本章给练习仓库补齐基本说明。不是每个项目都需要同样的文件，先理解各自用途。

### inventory | 文件与目录各负责什么

| 文件 | 用途 |
| --- | --- |
| README.md | 项目首页与运行入口 |
| .gitignore | Git 对未跟踪文件的忽略规则 |
| LICENSE | 使用、修改和分发许可 |
| CONTRIBUTING.md | 贡献流程、测试和风格约定 |
| CHANGELOG.md | 面向使用者的版本变化 |
| .github/workflows/ | 自动化工作流 |
| package.json | JavaScript 项目的元数据、依赖和脚本 |
| package-lock.json 等锁文件 | 记录依赖解析结果，帮助一致安装 |
| .env.example | 环境变量名称和可公开的占位示例 |

文件名以点开头时，系统可能默认隐藏。先在文件管理器开启显示扩展名与隐藏文件，再确认 `.gitignore` 没有变成 `.gitignore.txt`。

官方文档：[仓库文件](https://docs.github.com/en/repositories/working-with-files)

### ignore | 正确使用 .gitignore

```gitignore
# 本机依赖和构建结果
node_modules/
dist/

# 本地环境配置
.env
.env.local

# 编辑器和系统临时文件
.DS_Store
```

把规则写在仓库根目录的 `.gitignore` 后，运行 `git status` 查看结果。`git check-ignore -v 文件路径` 可以说明命中了哪条规则。已经被 Git 跟踪的文件不会因为加入规则而自动从历史消失。

如果普通生成文件已经跟踪，可先确认它确实不应入库，再使用 `git rm --cached 文件路径`，提交停止跟踪的变化；这会保留工作区文件。凭据泄露必须先撤销或轮换，单纯删除文件无法使旧凭据失效。

官方文档：[忽略文件](https://docs.github.com/en/get-started/git-basics/ignoring-files)

### manifest | 读懂 package.json 与锁文件

```json
{
  "name": "learning-notes",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

这是阅读结构的示例，不要求现在安装这个版本。`scripts` 定义命令别名，例如 `npm run dev` 执行 dev 脚本；依赖字段记录项目需要的包。修改依赖后，包管理器通常也会修改锁文件，二者应一起审查。

初学纯 HTML/CSS/JS 并不必须有 package.json。需要开发服务器或构建工具时，再按工具的当前官方安装说明建立项目。

官方文档：[npm package.json](https://docs.npmjs.com/cli/configuring-npm/package-json) · [npm ci](https://docs.npmjs.com/cli/commands/npm-ci)

### exercise | 完成仓库说明检查

为 `learning-notes` 新建 `docs/project-files` 分支，添加 README 的“目录”和“运行”两节，增加符合项目实际情况的 `.gitignore`。如果代码尚未决定许可，先了解许可证的差别，不要随意复制他人名字的 LICENSE。

检查提交差异：不能包含 `node_modules`、私人环境变量或不相关截图。给 PR 写清楚新增了哪些文件、如何检查。合并后，点开 README 中每个相对链接，确认没有 404。

官方文档：[关于比较差异](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/viewing-and-comparing-commits/comparing-commits)

## setup | 安装 Git 与连接 GitHub

本章从网页转到本地操作。命令中的用户名和仓库地址是占位符，执行前换成你自己的值。一次执行一行，确认结果后再继续。

### terminal | 终端、路径与当前目录

终端在一个“当前目录”里执行命令。Windows 可使用 PowerShell 或 Git Bash，macOS、Linux 可使用系统终端。不同终端的文件操作语法可能不同，但 `git ...` 子命令基本一致。

在 PowerShell 中，`Get-Location` 查看当前位置，`Get-ChildItem` 列出文件，`Set-Location "D:\projects"` 切换目录；在 Bash 中对应 `pwd`、`ls` 和 `cd`。路径中有空格时加引号。不要把示例里的命令提示符 `$` 或 `>` 一起复制。

官方文档：[设置 Git](https://docs.github.com/en/get-started/git-basics/set-up-git)

### identity | 安装与配置提交署名

从 Git 官方网站选择系统安装包。安装结束后重新打开终端，执行：

```sh
git --version
git config --global user.name "你的显示名称"
git config --global user.email "你的提交邮箱"
git config --global --get user.name
git config --global --get user.email
```

前两项是提交署名，不是 GitHub 登录密码。邮箱需与账号关联，或使用 GitHub 邮箱设置中提供的 noreply 地址。`--global` 影响当前电脑用户；进入仓库后省略它，可以为单个项目设置不同署名。

预期结果：第一行输出版本，后两行显示刚设置的值。若提示找不到 git，先检查安装和终端重启，不要反复执行提交命令。

官方文档：[Git 下载](https://git-scm.com/downloads) · [设置用户名](https://docs.github.com/en/get-started/git-basics/setting-your-username-in-git) · [提交邮箱](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)

### credentials | HTTPS、SSH 与登录凭据

HTTPS 地址形如 `https://github.com/用户名/仓库.git`；SSH 地址形如 `git@github.com:用户名/仓库.git`。它们都能用于同步，认证方式不同。HTTPS 可按官方说明使用 Git Credential Manager 或 GitHub CLI；GitHub 的 Git 操作不再接受账号密码作为 HTTPS 密码。

选择 SSH 时，先查看电脑是否已有密钥，按官方流程生成，再把**公钥**添加到 GitHub。私钥留在本机。连接测试可运行 `ssh -T git@github.com`；首次连接应核对官方公布的主机指纹。

不要把令牌直接嵌入仓库 URL、README 或截图。GitHub 网页能登录，不代表终端已经完成认证。

官方文档：[HTTPS 凭据管理](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git) · [SSH 连接](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### clone | 克隆并确认本地状态

```sh
git clone https://github.com/你的用户名/learning-notes.git
cd learning-notes
git status
git remote -v
git branch --show-current
```

克隆通常会新建一个同名文件夹，第二行进入它。`git status` 应显示工作区没有待提交修改；`git remote -v` 显示 origin 的获取和推送地址。若出现“不是 Git 仓库”，先检查当前目录是否真的进入了克隆目录。

练习：在编辑器打开 README，改一个字并保存，再运行 `git status`。你应看到 modified；网页暂时不会改变。

官方文档：[克隆仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)

## workflow | 分支、暂存、提交与推送

本章把本地的一次修改完整送到 GitHub。使用练习仓库，不要在不熟悉的项目中直接修改默认分支。

### areas | 工作区、暂存区与本地提交

工作区是编辑器里正在修改的文件；暂存区保存“准备放进下一次提交”的内容；本地历史保存已经提交的快照。你可以继续修改一个已暂存的文件，因此暂存区和工作区可能同时存在不同版本。

```sh
git status
git diff
git add README.md
git diff --cached
```

`git diff` 主要查看尚未暂存的差异，`git diff --cached` 查看即将提交的差异。开始时使用明确文件名，比直接 `git add .` 更容易控制提交范围。

官方文档：[记录每次更新](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)

### branch | 在独立分支中工作

```sh
git switch -c docs/local-practice
git branch --show-current
```

第一行创建并切换分支，第二行确认当前位置。然后在 README 增加一段“本地练习”内容并保存。分支名用用途加简短主题，例如 `fix/menu-focus`，不要用“最终版2”。

切换分支前检查 `git status`。有未提交修改时，Git 有时会阻止切换，以免覆盖文件；先理解并处理这些修改，再决定继续提交、暂存工作进度或撤销。

官方文档：[分支简介](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

### stage | 创建范围清楚的提交

```sh
git diff -- README.md
git add README.md
git diff --cached
git commit -m "docs: add local practice steps"
git log -1 --oneline
```

提交说明回答“做了什么”，复杂修改还需解释“为什么”。一条提交尽量只围绕一个可说明的目的。提交前检查配置、临时文件和其他人的改动是否混进来。

如果 commit 提示没有要提交的内容，查看文件是否保存、是否暂存、当前目录是否正确。如果进入了终端文本编辑器，不确定如何保存退出时，先查该编辑器用法；以后可以使用 `-m` 提交简短说明。

官方文档：[git commit](https://git-scm.com/docs/git-commit)

### pull-request | 推送与创建 PR

```sh
git push -u origin docs/local-practice
```

这会把当前练习分支推送到 origin，并建立后续同步关联。之后在该分支可直接使用 `git push`。推送成功后，打开 GitHub 的 PR 入口，确认 base 是要合入的分支，compare 是你的工作分支。

PR 描述写修改原因、主要变化和验证方法。在 Files changed 逐个检查文件；如果发现多余改动，先在工作分支修正并再次推送，PR 会自动更新。推送失败不等于提交丢失，本地历史仍然存在。

官方文档：[推送提交](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository) · [创建 PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)

### update | 合并后同步本地

```sh
git switch main
git pull --ff-only origin main
git status
```

示例假设默认分支叫 main。`--ff-only` 只接受快进更新；若本地已有不同提交，命令会停止，让你先检查，而不是自动产生合并。查看远端变化但暂不修改工作区，可先用 `git fetch origin`。

确认 PR 已合并、工作区干净且修改已进入默认分支后，才考虑删除练习分支。分支被删除并不等于已合并的代码被删除。

官方文档：[从远程获取更改](https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository)

## history | 查看历史与撤销修改

先判断修改是否已提交、是否已共享，再选择撤销方式。练习本章前，确认没有需要保留的未提交文件。

### inspect | 找到一次改动的来源

```sh
git log --oneline --decorate -8
git show HEAD
git log --oneline -- README.md
git diff HEAD~1 HEAD -- README.md
```

HEAD 通常表示当前检出的提交。`HEAD~1` 表示沿第一父链向前一个提交，仓库至少要有两次提交才有这个位置。先读提交说明，再看差异，必要时回到关联 PR 理解背景。

练习：找出 README 最近一次修改的提交号，查看它改了哪些行。提交号可以缩写，但需要足够长，避免与其他提交重名。

官方文档：[查看提交历史](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)

### unstage | 取消暂存但保留文件修改

```sh
git restore --staged README.md
git status
```

这条命令把 README 从“准备提交”移回“尚未暂存”，文件里刚写的内容仍然保留。它适用于已经存在提交历史的仓库。

不要与 `git restore README.md` 混淆：后者会用暂存区内容覆盖工作区文件，可能丢掉未暂存修改。执行带覆盖含义的命令前，先看 diff 并另存需要保留的内容。

官方文档：[git restore](https://git-scm.com/docs/git-restore)

### revert | 撤销已经共享的提交

```sh
git log --oneline -5
git revert 要撤销的提交号
git log --oneline -3
```

把占位文字换成练习提交的真实提交号。revert 会新增一条反向修改提交，保留原历史，适合已推送、已被别人使用的分支。它仍可能产生冲突，需要按文件实际情况解决。

如果只是刚写完、尚未共享的最后一条提交需要补充文件，可先暂存补充内容再 `git commit --amend`；这会改变提交身份，不应随意用于他人已经基于其工作的历史。

官方文档：[git revert](https://git-scm.com/docs/git-revert) · [重写历史](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

### recover | 找不到提交时先查 reflog

`git reflog` 记录本地引用最近的移动，能帮助找到切换或重置前的提交。发现目标后，可以先创建新分支指向它，例如 `git branch rescue-notes 提交号`，再检查文件，不必立刻覆盖当前分支。

reflog 不是永久备份，也不会自动同步到远端。不要把它当作可以随意删除文件的保证。日常更可靠的做法是小范围提交、及时推送和清楚的分支命名。

官方文档：[git reflog](https://git-scm.com/docs/git-reflog)

## contribute | Issue、Fork 与协作审查

参与别人的项目时，先遵守其 CONTRIBUTING 和讨论约定。第一次贡献可以从修正文档或补充可复现测试开始。

### issue | 写一份可以复现的问题报告

先搜索已有 Issue，再提供：项目版本、系统和运行环境、最小复现步骤、实际结果、预期结果，以及必要日志。截图适合展示布局问题，报错文字最好同时以文本提供，便于搜索。

```markdown
## 复现
1. 打开设置页
2. 用 Tab 移到保存按钮
3. 按 Enter

## 实际
页面刷新，输入内容丢失。

## 预期
保存后保留当前输入。
```

避免只写“不能用”。如果不确定是不是缺陷，可以按项目约定先到讨论区提问。

官方文档：[创建 Issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)

### fork | origin 与 upstream

在 GitHub Fork 目标仓库，再克隆自己的副本。此时 origin 通常指向你的仓库，upstream 可以作为原项目的别名：

```sh
git remote add upstream https://github.com/原作者/原仓库.git
git remote -v
git fetch upstream
```

这些名称只是约定，`git remote -v` 才能确认实际地址。为贡献创建工作分支，向自己的 origin 推送，再向原项目创建 PR；不需要原项目的直接推送权限。

官方文档：[Fork 仓库](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)

### sync | 同步上游改动

```sh
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
```

这里假设两边默认分支都叫 main，且你没有在自己的 main 上做独立提交。若不能快进，先查看历史，按项目流程决定合并或变基，不要为了让命令成功就直接强制推送。

网页端也提供同步 Fork 的入口。同步默认分支后，新任务从更新后的默认分支创建，减少与旧代码重复工作的机会。

官方文档：[同步 Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)

### review | 回应审查与维护 PR

一次 PR 围绕一个问题。按项目要求运行检查，把实际执行的命令和结果写进描述。审查者提出修改后，直接在同一工作分支提交并推送；无须关闭再建一个内容相同的 PR。

讨论中说明依据：具体文件、复现结果、文档或测试。不同意建议时可以解释原因。只有确认问题已处理后，再按团队约定解决讨论。不要为修一个错别字顺手重排整份文件，这会增加审查难度。

官方文档：[关于 PR 审查](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)

## troubleshoot | 冲突与常见错误

报错时保留当前状态，先收集证据。本章命令用于定位问题，不要求把所有命令依次执行。

### diagnose | 根据错误定位问题

| 现象 | 首先检查 |
| --- | --- |
| not a git repository | 当前目录、是否进入克隆后的文件夹 |
| nothing to commit | 文件是否保存、是否暂存、当前分支 |
| Repository not found | 仓库地址、大小写、账号访问权限 |
| Permission denied (publickey) | SSH 公钥、代理和实际使用的账号 |
| non-fast-forward | 远端是否比本地新增了提交 |
| untracked files would be overwritten | 是否有未跟踪文件与目标分支冲突 |

定位时依次看 `git status`、`git branch --show-current`、`git remote -v`、`git log --oneline -5`。向别人求助时隐去令牌和私有地址中的敏感信息，但保留准确错误文字。

官方文档：[Git 使用与排错](https://docs.github.com/en/get-started/using-git) · [非快进错误](https://docs.github.com/en/get-started/using-git/dealing-with-non-fast-forward-errors)

### conflicts | 逐步处理合并冲突

当两条分支修改同一位置，Git 可能无法自动判断应保留什么。冲突文件常出现 `<<<<<<<`、`=======`、`>>>>>>>` 标记。先运行 `git status` 找到文件，阅读两边意图，再编辑成最终应该保留的内容，并删除这些标记。

完成后运行项目检查，再 `git add 文件路径`。如果是普通 merge，按提示完成 `git commit`；如果是 rebase，按提示运行 `git rebase --continue`。不要混用流程。

如果暂时无法判断，合并过程中可用 `git merge --abort`，变基过程中可用 `git rebase --abort` 返回对应操作前的状态。开始操作前就有未提交修改时，恢复行为可能更复杂，因此应先整理工作区。

官方文档：[解决合并冲突](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line)

### secrets | 误提交凭据与忽略规则失效

凭据曾推到远端时，先撤销或轮换，然后按平台说明清理历史、检查使用记录和协作者副本。把文件从最新提交删掉，并不能移除历史中的内容。不要把“私有仓库”当作凭据存储方案。

如果只是普通生成文件忘记忽略，检查它是否已经跟踪，再决定停止跟踪。涉及重写远程历史的清理应与协作者协调，不要在不理解影响时照抄强制推送命令。

官方文档：[从仓库删除敏感数据](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

### line-endings | 换行、大小写与跨系统差异

Windows 与 Unix 系统常见的换行方式不同。项目可用 `.gitattributes` 统一文本规则，例如 `* text=auto`。调整规则后先审查差异，避免一次功能修改混入整仓库换行变化。

某些文件系统不区分文件名大小写，部署环境却可能区分。`Logo.png` 与 `logo.png` 应视为不同路径。浏览器页面正常但部署后图片 404 时，先核对大小写和相对路径。

官方文档：[处理换行](https://docs.github.com/en/get-started/git-basics/configuring-git-to-handle-line-endings)

## publish | Tag、Release 与 Actions

发布应对应一个已经验证的提交。使用者需要知道版本改了什么，维护者需要能找到构建结果来自哪里。

### releases | 标签与版本发布

```sh
git status
git tag -a v0.1.0 -m "First practice release"
git push origin v0.1.0
```

仅在练习仓库确认当前提交正确后执行。标签标记特定提交；Release 在标签基础上提供说明和附件。发布说明应写新增、修复、使用上的变化和已知限制，而不是把所有提交标题直接拼接。

已经被别人使用的版本标签不应随意移动。需要修复时通常发布新版本。版本号的规则由项目约定，常见的语义化版本用主、次、修订号表达不同程度的变化。

官方文档：[管理 Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) · [语义化版本](https://semver.org/)

### actions | 读懂一份最小工作流

```yaml
name: Repository check
on: [push, pull_request]
permissions:
  contents: read
jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - name: Check required file
        run: test -f README.md
```

把示例保存为 `.github/workflows/check.yml` 后，它会在相应事件发生时运行。`jobs` 包含任务，`steps` 是任务里的顺序步骤。示例只检查 README 是否存在，不等于应用已经通过完整测试。实际项目应按其运行环境配置构建、类型检查和测试；Action 版本应查看当前官方说明后选择。

官方文档：[理解 GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) · [checkout 官方用法](https://github.com/actions/checkout)

### logs | 看懂检查失败与权限

打开 PR 的检查项或 Actions 页面，进入失败的 job，再展开失败步骤，先读第一条与项目有关的错误。后面的错误可能只是前面失败的连锁结果。

工作流通常从最小权限开始。密钥放在仓库或组织配置的 Secrets 中，通过官方机制读取，不写进 YAML。来自 Fork 的 PR 有不同的信任边界，不要随意修改事件类型来绕过凭据限制。

官方文档：[查看工作流日志](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/using-workflow-run-logs) · [在 Actions 中使用 Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

## pages | 发布第一个静态网站

本章把 HTML/CSS/JS 练习发布到 GitHub Pages。它适合静态文件，不会直接运行你的数据库或普通 Node.js 服务端进程。

### prepare | 准备最小网站

```text
learning-site/
├── index.html
├── style.css
├── app.js
└── images/
```

入口文件名用 `index.html`。先在本地验证链接、图片和脚本都正常，再提交推送。项目站点的访问地址通常带仓库名前缀，因此在简单练习中可用 `./style.css`、`./app.js` 这样的相对路径，避免误指向域名根目录。

官方文档：[关于 GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)

### deploy | 选择发布来源并检查部署

在仓库设置的 Pages 页面，按当前界面选择从分支发布，选择实际存放静态文件的分支和目录，保存后查看部署结果。需要构建工具的项目可以使用 Actions 发布，但不要把源代码目录和构建产物目录混为一谈。

部署完成后，通过 Pages 给出的真实地址访问。不要仅凭本地成功就判断发布成功。若返回 404，依次检查部署状态、入口文件名、发布目录、路径前缀和文件名大小写。

官方文档：[配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### verify | 用浏览器验证线上结果

打开开发者工具的 Network，刷新页面，检查 HTML、CSS、JS 和图片的状态码。若 CSS 404，先看请求 URL 是否包含正确的项目路径。若 JS 请求返回 HTML，通常是路径或服务器回退设置出了问题。

再用窄窗口和键盘操作一次：导航链接能否打开，按钮能否获得焦点，表单是否有标签。页面标题、描述和版权信息也应与练习项目一致。

官方文档：[GitHub Pages 排错](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)

## project | 独立完成一个学习仓库

这个练习把前面的操作串起来。你可以使用 Web 三件套教程完成页面，再回到本章整理仓库和发布。

### plan | 把任务拆成可检查的改动

建立 `learning-site` 仓库，目标是发布一个能添加学习任务的小页面。把工作拆成四个 Issue：HTML 结构、CSS 布局、JavaScript 交互、文档和发布。每个任务写清“怎样算完成”。

例如“添加任务”应包含：空白输入不新增；成功后输入框清空；列表显示用户输入；刷新后内容仍保留。这样 PR 的验证方法就有了依据。

官方文档：[关于 Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)

### deliver | 按分支完成与审查

每次从最新默认分支创建任务分支，完成一项后提交 PR。描述中关联 Issue，列出修改和检查结果。合并后同步本地，再开始下一项。

给 README 写完整启动与使用步骤，加入网站地址和一张必要截图。确认锁文件、源码和文档在仓库中，依赖目录、私人环境文件和临时产物不在提交范围。

官方文档：[GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)

### checklist | 自测与继续学习

- 能解释 Git 与 GitHub 的区别，并指出本地修改、提交和推送分别发生在哪一步。
- 能从一个空文件夹或远程仓库开始，建立分支、查看差异、提交并创建 PR。
- 能写 README、配置忽略规则，区分下载源码与下载应用。
- 能解释冲突产生的原因，知道何时停止操作并检查历史。
- 能根据部署日志和浏览器网络请求定位发布问题。

若某一项只能照抄命令，回到相应章节重新做一次不同文件名的练习。接着阅读 [HTML 入门](/encyclopedia/html)，从网页结构开始。

官方文档：[GitHub 入门目录](https://docs.github.com/en/get-started) · [Pro Git](https://git-scm.com/book/en/v2)
