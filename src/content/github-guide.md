## start | 从零开始

Git 在电脑上记录文件的历史。GitHub 托管 Git 仓库，还提供讨论、审查和发布功能。一个仓库可以同时包含代码、文档、版本记录和项目讨论。

| 术语 | 什么时候会用到 |
| --- | --- |
| 仓库 Repository | 找到项目文件和历史。地址通常包含 `owner/repo` |
| 提交 Commit | 为一次具体改动留下快照和说明 |
| 分支 Branch | 在独立的工作线上改东西，准备好再合并 |
| Issue | 报告问题、提需求，或记录待处理的工作 |
| Pull request | 提议合并某个分支的改动，供他人审查 |

### 第一次练习

1. 在 GitHub 创建一个私有练习仓库，初始化时添加 README。
2. 从默认分支新建 `docs/hello` 分支。在网页编辑 README，提交一段简短的项目介绍。
3. 发起 pull request，检查目标分支是默认分支，预览文件差异。确认后合并，再回到仓库首页查看结果。

[GitHub 官方 Hello World 练习](https://docs.github.com/zh/get-started/start-your-journey/hello-world)

## browse | 阅读与下载项目

先读 README 的用途、安装步骤和运行环境，再看最近提交、未关闭的问题和 `LICENSE`。查看许可证和分发条件后，再决定如何复用源码。

| 我想做什么 | 从哪里开始 |
| --- | --- |
| 装好后直接使用 | 在 **Releases** 找适合系统和架构的安装包，按说明核对版本 |
| 只看一次源码 | **Code → Download ZIP**，解压后从 README 指出的入口读起 |
| 跟踪更新或改代码 | 从 **Code** 复制克隆地址，用 `git clone` 保留提交历史 |
| 查找某类项目 | 用 `language:python`、`topic:cli` 或 `stars:>100` 缩小仓库搜索范围 |

Release 的安装包和自动生成的 Source code ZIP 用途不同。归档仓库也可能依然可用，可以从项目说明确认维护状态和推荐替代项目。

[GitHub 搜索语法](https://docs.github.com/zh/search-github/searching-on-github/searching-for-repositories) · [仓库发布说明](https://docs.github.com/zh/repositories/releasing-projects-on-github/about-releases)

## setup | 安装 Git 与认证

安装 Git，打开终端，设置新提交的署名。邮箱需要与 GitHub 账号关联。想隐藏私人邮箱时，可在 GitHub 邮箱设置里找到自己的 `noreply` 地址。

```sh
git --version
git config --global user.name "你的显示名称"
git config --global user.email "你的提交邮箱"
```

使用 HTTPS 时，可以通过 Git Credential Manager 登录，或安装 GitHub CLI 后运行 `gh auth login`。在要求凭据的 HTTPS 场景里，使用令牌或凭据管理器。使用 SSH 时，把本机 SSH **公钥**添加到 GitHub，私钥留在本机。

```sh
gh auth login
git clone https://github.com/OWNER/REPO.git
cd REPO
git remote -v
```

把示例中的 `OWNER`、`REPO` 替换成真实仓库信息。令牌、私钥和 `.env` 都应留在版本库之外。

[配置 Git](https://docs.github.com/zh/get-started/git-basics/set-up-git) · [认证方式](https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)

## workflow | 分支、提交与推送

在你有写权限的仓库里，用工作分支完成一次小改动。以下示例假设默认分支叫 `main`，并且仓库已有 `README.md`。

```sh
git switch main
git pull --ff-only
git switch -c docs/readme
# 编辑 README.md 后执行下面的命令
git status
git diff
git add README.md
git diff --cached
git commit -m "docs: clarify setup steps"
git push -u origin docs/readme
```

`git diff` 检查工作区修改，`git diff --cached` 检查下一次提交会包含哪些修改。提交后到 GitHub 打开 pull request，写明改动目的、验证方式和相关 Issue。等待检查通过，并处理审查意见。

[关于分支](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches) · [创建拉取请求](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)

## contribute | 参与开源项目

先看 `CONTRIBUTING.md` 和现有 Issue。如果准备修复一个问题，描述计划并确认维护者是否接受。报告问题时，写上版本、系统、最小复现步骤、预期结果和实际结果，贴日志前检查其中的私人信息。

没有原仓库写权限时，先 Fork 到自己的账号。克隆自己的 Fork 后，将原仓库添加为 `upstream`。

```sh
git remote add upstream https://github.com/ORIGINAL_OWNER/REPO.git
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
git switch -c fix/example
```

在工作分支完成修改并推送到 `origin`，从自己的工作分支向原仓库默认分支打开 pull request。根据审查意见继续往同一分支推送，PR 会更新。

[同步 Fork](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) · [创建 Issue](https://docs.github.com/zh/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)

## troubleshoot | 遇到问题时

| 现象 | 先检查什么 |
| --- | --- |
| `Permission denied (publickey)` | `git remote -v` 是否是 SSH 地址，本机公钥是否已加到当前账号 |
| HTTP `403` 或 `Repository not found` | 检查仓库地址、登录账号和仓库权限。私有仓库需要访问权 |
| `non-fast-forward` | `git fetch` 后检查远端新增提交，按团队流程合并或变基再推送 |
| 合并冲突 | 用 `git status` 找冲突文件，编辑并删除冲突标记，验证后按终端提示继续 |
| 改错文件或漏提交 | 先用 `git status` 和 `git diff` 确认修改。已经共享的错误提交可通过 `git revert` 留下一条撤销记录 |

如果令牌已经提交或公开，先撤销或轮换凭据，再处理历史记录。`.gitignore` 只影响尚未被跟踪的文件。

[解决合并冲突](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line) · [从仓库移除敏感数据](https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## publish | 发布版本与自动检查

**Tag** 标记某次提交。**Release** 围绕一个 Tag 发布版本说明和附件。发布前确认目标提交、构建结果、变更说明和安装方式，再上传与版本对应的产物。

仓库的 **Actions** 可以在 push 或 pull request 时运行测试。工作流存放于 `.github/workflows/`。第一次配置时，可从项目使用的语言模板开始，仅开启构建和测试，确认日志和退出状态正确后再添加发布步骤。

把部署凭据保存在仓库或环境的 Secrets 中，并限制工作流令牌权限。审查来自 Fork 的工作流变更和运行权限。

[管理仓库发行版](https://docs.github.com/zh/repositories/releasing-projects-on-github/managing-releases-in-a-repository) · [GitHub Actions 快速入门](https://docs.github.com/zh/actions/writing-workflows/quickstart)
