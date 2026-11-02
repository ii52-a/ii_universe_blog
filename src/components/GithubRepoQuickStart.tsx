import { useState } from 'react'
import { ArrowUpRight, Copy, Download, GitBranch, MessageCircle } from 'lucide-react'
import type { GithubRepoDetail } from '../lib/backend'
import { useToast } from '../context/ToastContext'

function homepageUrl(value: string) {
  if (!value.trim()) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

export function GithubRepoQuickStart({ repo }: { repo: GithubRepoDetail }) {
  const [goal, setGoal] = useState('use')
  const [protocol, setProtocol] = useState('https')
  const { showToast } = useToast()
  const homepage = homepageUrl(repo.homepage)
  const commands: Record<string, string> = {
    https: `git clone https://github.com/${repo.fullName}.git`,
    ssh: `git clone git@github.com:${repo.fullName}.git`,
    cli: `gh repo clone ${repo.fullName}`,
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(commands[protocol]); showToast('克隆命令已复制。') }
    catch { showToast('没有复制成功，可以手动选择命令。', 'error') }
  }

  return <section className="repo-quickstart" aria-labelledby="repo-quickstart-title">
    <span className="repo-kicker">下一步</span><h2 id="repo-quickstart-title">从发现，到上手。</h2>
    <div className="repo-goals" role="tablist" aria-label="使用目标">
      {[['use', '直接使用'], ['source', '学习源码'], ['contribute', '参与项目']].map(([value, label]) =>
        <button key={value} type="button" role="tab" id={`repo-goal-${value}`} aria-controls="repo-goal-panel" aria-selected={goal === value} onClick={() => setGoal(value)}>{label}</button>)}
    </div>
    <div role="tabpanel" id="repo-goal-panel" aria-labelledby={`repo-goal-${goal}`}>
      {goal === 'use' ? <>
        <p>先找官网或发布版本，再按 README 安装。源码 ZIP 通常不是安装包。</p>
        {homepage && <a className="repo-action repo-action--primary" href={homepage} target="_blank" rel="noopener noreferrer">打开项目官网 <ArrowUpRight size={14} /></a>}
        <a className="repo-action" href={`${repo.url}/releases`} target="_blank" rel="noopener noreferrer"><Download size={14} /> 查看发布版本</a>
        <span className="repo-action-hint">安装包是否提供、支持哪些系统，以作者说明为准。</span>
        <a className="repo-action" href="#repo-readme-title">阅读安装说明 ↓</a>
      </> : goal === 'source' ? <>
        <p>已安装 Git？复制命令，在终端进入你的项目目录后运行。</p>
        <label className="repo-protocol" htmlFor="repo-clone-protocol">克隆方式</label><select className="repo-protocol-select" id="repo-clone-protocol" value={protocol} onChange={(event) => setProtocol(event.target.value)}>
          <option value="https">HTTPS · 通用方式</option><option value="ssh">SSH · 已配置密钥</option><option value="cli">GitHub CLI · 已安装 gh</option>
        </select>
        <div className="repo-command"><code>{commands[protocol]}</code><button type="button" onClick={() => void copy()} aria-label="复制克隆命令"><Copy size={15} /></button></div>
        <p className="repo-action-hint">{protocol === 'ssh' ? '需要先在 GitHub 配置 SSH 公钥。' : protocol === 'cli' ? '需要先安装 GitHub CLI，并按提示登录。' : '克隆会下载代码和版本历史；启动方式请看 README。'}</p>
        {repo.defaultBranch && <a className="repo-action" href={`${repo.url}/archive/refs/heads/${repo.defaultBranch.split('/').map(encodeURIComponent).join('/')}.zip`} target="_blank" rel="noopener noreferrer"><Download size={14} /> 下载源码 ZIP</a>}
        <a className="repo-action" href="#repo-readme-title">查看项目说明 ↓</a>
      </> : <>
        <p>先了解贡献约定，再找一个范围较小的问题。提交 Issue 前先搜索已有讨论。</p>
        {repo.hasIssues ? <>
          <a className="repo-action" href={`${repo.url}/issues?q=${encodeURIComponent('is:issue is:open label:"good first issue"')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> 适合新手的 Issue</a>
          <a className="repo-action" href={`${repo.url}/issues`} target="_blank" rel="noopener noreferrer">查找问题与讨论 <ArrowUpRight size={14} /></a>
        </> : <p className="repo-action-hint">这个仓库未启用 Issue，请先查看作者的沟通与贡献说明。</p>}
        <a className="repo-action" href={`${repo.url}/pulls`} target="_blank" rel="noopener noreferrer"><GitBranch size={14} /> 查看 Pull requests</a>
        <a className="repo-action" href="#repo-readme-title">阅读贡献说明 ↓</a>
      </>}
    </div>
    <div className="repo-facts"><h3>仓库信息</h3><dl>
      <div><dt>默认分支</dt><dd>{repo.defaultBranch || '未提供'}</dd></div>
      <div><dt>许可证</dt><dd>{repo.license || '未标明'}</dd></div>
      <div><dt>主要语言</dt><dd>{repo.language || '未检测到'}</dd></div>
      <div><dt>项目状态</dt><dd>{repo.archived ? '已归档' : '未归档'}{repo.isFork ? ' · Fork' : ''}</dd></div>
    </dl></div>
  </section>
}
