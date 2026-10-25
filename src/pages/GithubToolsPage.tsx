import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, X } from 'lucide-react'
import { githubApi, type GithubTool, type GithubToolCategory } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'

const emptyForm = { url: '', description: '', experience: '', categoryId: '' }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(value))
    .replace(/\//g, '.')
}

export function GithubToolsPage() {
  usePageTitle('ii tool')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tools, setTools] = useState<GithubTool[]>([])
  const [categories, setCategories] = useState<GithubToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)
  const admin = user?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const [toolData, categoryData] = await Promise.all([
        githubApi.tools(),
        githubApi.toolCategories(),
      ])
      setTools(toolData.tools)
      setCategories(categoryData.categories)
      setError('')
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
      categoryId: tool.categoryId ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const input = {
        url: form.url,
        description: form.description,
        experience: form.experience,
        categoryId: form.categoryId || null,
      }
      if (editingId) {
        await githubApi.updateTool(editingId, input)
      } else {
        await githubApi.createTool(input)
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

  const addCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!categoryName.trim()) return
    setCategoryBusy(true)
    try {
      await githubApi.createToolCategory(categoryName.trim())
      setCategoryName('')
      await load()
      showToast('分类加好了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有加上。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

  const removeCategory = async (category: GithubToolCategory) => {
    if (!window.confirm(`删除分类“${category.name}”？里面的仓库会移到未分类。`)) return
    setCategoryBusy(true)
    try {
      await githubApi.removeToolCategory(category.id)
      await load()
      showToast('分类删掉了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

  const groups = [
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: tools.filter((tool) => tool.categoryId === category.id),
    })),
    {
      id: 'uncategorized',
      name: '未分类',
      items: tools.filter((tool) => !tool.categoryId),
    },
  ].filter((group) => group.items.length > 0)

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
          <>
            <section className="tool-category-admin" aria-labelledby="tool-category-title">
              <div className="repo-section-head">
                <h2 id="tool-category-title">分类</h2>
                <span>{categories.length} 个</span>
              </div>
              <form className="tool-category-admin__add" onSubmit={addCategory}>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="新分类"
                  aria-label="新分类名称"
                />
                <button type="submit" className="button button--ink button--small" disabled={categoryBusy || !categoryName.trim()}>
                  <Plus size={13} aria-hidden="true" />
                  新增分类
                </button>
              </form>
              <div className="tool-category-admin__list">
                {categories.map((category) => (
                  <span key={category.id}>
                    {category.name}
                    <button
                      type="button"
                      onClick={() => void removeCategory(category)}
                      disabled={categoryBusy}
                      aria-label={`删除分类 ${category.name}`}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </section>

            <section className="tool-form-wrap" aria-labelledby="tool-form-title">
              <h2 id="tool-form-title">{editingId ? '编辑仓库' : '新增仓库'}</h2>
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
                  分类
                  <select
                    value={form.categoryId}
                    onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  >
                    <option value="">未分类</option>
                    {categories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
          </>
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
        ) : groups.length === 0 ? (
          <div className="lab-empty">
            <p>还没有 ii tool。</p>
          </div>
        ) : (
          <div className="tool-groups">
            {groups.map((group) => (
              <section className="tool-group" key={group.id} aria-labelledby={`tool-group-${group.id}`}>
                <div className="tool-group__head">
                  <h2 id={`tool-group-${group.id}`}>{group.name}</h2>
                  <span>{group.items.length}</span>
                </div>
                <div className="tool-list">
                  {group.items.map((tool) => {
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
                        <p className="tool-card__date">
                          添加 {formatDate(tool.createdAt)} · 最后修改 {formatDate(tool.updatedAt)}
                        </p>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
