# 下载的 UI skill

这个目录保存了从 GitHub 取下的前端 UI / UX 参考资料，用来约束视觉方向和交互质量。它们只作为方法与检查表使用，页面代码为原创实现。

| 目录 | 来源 | 用途 |
| --- | --- | --- |
| `frontend-design/SKILL.md` | [anthropics/skills · frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | 避免模板化的 AI 视觉；字体、布局、文案与自我评审 |
| `ui-ux-pro-max/SKILL.md` | [aileague/ui-ux-pro-max-skill](https://github.com/aileague/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md) | 可访问性、表单、动效、响应式检查清单 |
| `web-interface-guidelines/README.md` | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | 键盘、焦点、表单、性能与内容细节 |

抽取出的执行重点：

- 不使用紫色渐变、统一圆角、居中大标题等模板化组合
- 一个页面只保留一个记忆点：这里是黄油色的电视玩偶「小满」
- 每个元素对齐到网格、基线或明确的视觉边缘
- 表单错误靠近字段，提交后聚焦第一个错误
- 触控目标不小于 44px；图标按钮必须有可访问名称
- 动画只使用 `transform` / `opacity`，并尊重 `prefers-reduced-motion`
- 文字和背景对比度达到 WCAG AA

下载日期：2026-10-19。原始仓库的许可与版权归各作者所有，使用前请查阅对应仓库的 LICENSE。
