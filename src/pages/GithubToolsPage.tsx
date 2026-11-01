/**
 * ii tool 页面
 * 职责：工具分类、工具卡片与新增/编辑弹窗。
 * 样式：src/css/pages/github-lab.css
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Tags, X } from 'lucide-react'
import { githubApi, type GithubTool, type GithubToolCategory } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/Modal'
import { LabTop } from '../components/LabTop'

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
  usePageTitle('ii tool', 'ii universe')
  const { can } = useAuth()
  const { showToast } = useToast()
  const [tools, setTools] = useState<GithubTool[]>([])
  const [categories, setCategories] = useState<GithubToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<GithubTool | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)
  const canManage = can('tools.manage')

  const load = async (category = activeCategory) => {
    setLoading(true)
    try {
      const [toolData, categoryData] = await Promise.all([
        githubApi.tools('', category),
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
    void load('')
  }, [])

  const selectCategory = (id: string) => {
    setActiveCategory(id)
    void load(id)
  }

  const closeToolModal = () => {
    if (saving) return
    setToolModalOpen(false)
    setEditingTool(null)
    setForm(emptyForm)
  }

  const openCreate = () => {
    setEditingTool(null)
    setForm({ ...emptyForm, categoryId: activeCategory === 'uncategorized' ? '' : activeCategory })
    setToolModalOpen(true)
  }

  const openEdit = (tool: GithubTool) => {
    setEditingTool(tool)
    setForm({
      url: tool.repoUrl,
      description: tool.description,
      experience: tool.experience,
      categoryId: tool.categoryId ?? '',
    })
    setToolModalOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const input = {
        url: form.url.trim(),
        description: form.description.trim(),
        experience: form.experience.trim(),
        categoryId: form.categoryId || null,
      }
      if (editingTool) {
        await githubApi.updateTool(editingTool.id, input)
      } else {
        await githubApi.createTool(input)
      }
      showToast(editingTool ? 'ii tool 改好了。' : 'ii tool 加好了。')
      setToolModalOpen(false)
      setEditingTool(null)
      setForm(emptyForm)
      await load(activeCategory)
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
      await load(activeCategory)
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
      if (activeCategory === category.id) setActiveCategory('')
      await load(activeCategory === category.id ? '' : activeCategory)
      showToast('分类删掉了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

  const categoryTabs = [
    { id: '', name: '全部' },
    ...categories,
    { id: 'uncategorized', name: '未分类' },
  ]

  return (
    <div className="lab-page">
      <div className="page-container">
        <LabTop section="ii tool" />

        <Link className="lab-back" to="/github-lab">
          <ArrowLeft size={13} aria-hidden="true" />
          返回
        </Link>

        <header className="lab-subhead">
          <div>
            <h1>ii tool</h1>
            <p className="lab-subhead__note">收在这里的工具，都写过一点使用体验。</p>
          </div>
          {canManage && (
            <div className="lab-subhead__actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setCategoryModalOpen(true)}
              >
                <Tags size={13} aria-hidden="true" />
                管理分类
              </button>
              <button
                type="button"
                className="button button--ink button--small"
                onClick={openCreate}
              >
                <Plus size={14} aria-hidden="true" />
                新增
              </button>
            </div>
          )}
        </header>

        <nav className="tool-category-tabs" aria-label="ii tool 分类">
          {categoryTabs.map((category) => (
            <button
              key={category.id || 'all'}
              type="button"
              className={activeCategory === category.id ? 'is-active' : ''}
              onClick={() => selectCategory(category.id)}
              aria-pressed={activeCategory === category.id}
            >
              {category.name}
            </button>
          ))}
        </nav>

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
          <div className="tool-list">
            {tools.map((tool) => {
              const [owner, repo] = tool.repoFullName.split('/')
              return (
                <article className="tool-card" key={tool.id}>
                  <div className="tool-card__head">
                    <Link to={`/github-lab/${owner}/${repo}`}>
                      <strong>{tool.repoFullName}</strong>
                    </Link>
                    {canManage && (
                      <button type="button" className="tool-edit" onClick={() => openEdit(tool)}>
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
        )}
      </div>

      <Modal
        open={toolModalOpen}
        title={editingTool ? '编辑 ii tool' : '新增 ii tool'}
        eyebrow="ii tool"
        description={
          editingTool
            ? '仓库地址、分类和体验都可以再改。'
            : '填一个 GitHub 仓库，把它收进 ii universe。'
        }
        onClose={closeToolModal}
      >
        <form className="tool-form" onSubmit={submit}>
          <label htmlFor="tool-url">
            GitHub 仓库 URL
            <input
              id="tool-url"
              type="url"
              value={form.url}
              placeholder="https://github.com/owner/repo"
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              required
            />
          </label>
          <label htmlFor="tool-category">
            分类
            <select
              id="tool-category"
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
          <label htmlFor="tool-description">
            仓库描述
            <textarea
              id="tool-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              required
            />
          </label>
          <label htmlFor="tool-experience">
            使用体验
            <textarea
              id="tool-experience"
              value={form.experience}
              onChange={(event) => setForm({ ...form, experience: event.target.value })}
              rows={4}
              placeholder="可以留空"
            />
          </label>
          <div className="modal__actions">
            <button type="submit" className="button button--ink button--small" disabled={saving}>
              {saving ? '保存中…' : editingTool ? '保存修改' : '新增'}
            </button>
            <button type="button" className="text-button" onClick={closeToolModal}>
              取消
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={categoryModalOpen}
        title="管理 ii tool 分类"
        eyebrow="ii tool"
        description="分类会出现在上方的小标题里。删除分类后，里面的仓库会移到未分类。"
        onClose={() => setCategoryModalOpen(false)}
      >
        <form className="tool-category-admin__add" onSubmit={addCategory}>
          <input
            type="text"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="新分类"
            aria-label="新分类名称"
          />
          <button
            type="submit"
            className="button button--ink button--small"
            disabled={categoryBusy || !categoryName.trim()}
          >
            <Plus size={13} aria-hidden="true" />
            新增分类
          </button>
        </form>
        <div className="tool-category-admin__list">
          {categories.length === 0 && <span className="tool-category-admin__empty">还没有分类。</span>}
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
      </Modal>
    </div>
  )
}
