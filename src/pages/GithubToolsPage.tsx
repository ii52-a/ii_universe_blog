import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { githubApi, type GithubTool } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'

const emptyForm = { url: '', description: '', experience: '' }

export function GithubToolsPage() {
  usePageTitle('ii tool')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tools, setTools] = useState<GithubTool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const admin = user?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const data = await githubApi.tools()
      setTools(data.tools)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '读取失败，稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const reset = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const edit = (tool: GithubTool) => {
    setEditingId(tool.id)
    setForm({
      url: tool.repoUrl,
      description: tool.description,
      experience: tool.experience,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await githubApi.updateTool(editingId, form)
      } else {
        await githubApi.createTool(form)
      }
      showToast(editingId ? 'ii tool 改好了。' : 'ii tool 加好了。')
      reset()
      await load()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有保存成功。', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lab-page">
      <div className="page-container">
        <header className="lab-top">
          <Link to="/universe">ii universe</Link>
          <Link to="/github-lab">GitHub 研究所</Link>
        </header>

        <Link className="lab-back" to="/github-lab">
          <ArrowLeft size={13} aria-hidden="true" />
          返回
        </Link>

        <header className="lab-subhead">
          <h1>ii tool</h1>
          <span>由 ii52A1 维护</span>
        </header>

        {admin && (
          <section className="tool-form-wrap" aria-labelledby="tool-form-title">
            <h2 id="tool-form-title">{editingId ? '编辑 ii tool' : '新增 ii tool'}</h2>
            <form className="tool-form" onSubmit={submit}>
              <label>
                GitHub 仓库 URL
                <input
                  type="url"
                  value={form.url}
                  placeholder="https://github.com/owner/repo"
                  onChange={(event) => setForm({ ...form, url: event.target.value })}
                  required
                />
              </label>
              <label>
                仓库描述
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={2}
                  required
                />
              </label>
              <label>
                使用体验
                <textarea
                  value={form.experience}
                  onChange={(event) => setForm({ ...form, experience: event.target.value })}
                  rows={3}
                />
              </label>
              <div className="tool-form__actions">
                <button type="submit" className="button button--ink button--small" disabled={saving}>
                  {saving ? '保存中…' : editingId ? '保存修改' : '新增'}
                </button>
                {editingId && (
                  <button type="button" className="text-button" onClick={reset}>
                    取消
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="lab-loading" role="status" aria-label="正在读取 ii tool">
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="lab-empty">
            <p>{error}</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="lab-empty">
            <p>还没有 ii tool。</p>
          </div>
        ) : (
          <section className="tool-list" aria-label="ii tool 列表">
            {tools.map((tool) => {
              const [owner, repo] = tool.repoFullName.split('/')
              return (
                <article className="tool-card" key={tool.id}>
                  <div className="tool-card__head">
                    <Link to={`/github-lab/${owner}/${repo}`}>
                      <strong>{tool.repoFullName}</strong>
                      <span>查看仓库简介</span>
                    </Link>
                    {admin && (
                      <button type="button" className="tool-edit" onClick={() => edit(tool)}>
                        <Pencil size={12} aria-hidden="true" />
                        编辑
                      </button>
                    )}
                  </div>
                  <p className="tool-card__description">{tool.description}</p>
                  {tool.experience && (
                    <div className="tool-card__experience">
                      <span>使用体验</span>
                      <p>{tool.experience}</p>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
