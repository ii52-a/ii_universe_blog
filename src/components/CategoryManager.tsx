import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { categoriesApi } from '../lib/backend'
import { useCategories } from '../hooks/useCategories'
import { useToast } from '../context/ToastContext'

export function CategoryManager() {
  const { categories, refresh } = useCategories()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await categoriesApi.create(name.trim())
      setName('')
      await refresh()
      showToast('分类加好了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有加上。', 'error')
    } finally {
      setBusy(false)
    }
  }

  const save = async (id: string) => {
    if (!editingName.trim()) return
    setBusy(true)
    try {
      await categoriesApi.update(id, editingName.trim())
      setEditingId('')
      setEditingName('')
      await refresh()
      showToast('分类改好了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有改成。', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await categoriesApi.remove(id)
      await refresh()
      showToast('分类删掉了。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="category-manager" aria-labelledby="category-manager-title">
      <div className="category-manager__head">
        <div>
          <h2 id="category-manager-title">文章分类</h2>
          <p>只有 ii52A1 能改；有文章的分类不能删。</p>
        </div>
        <span>{categories.length} 个</span>
      </div>

      <form className="category-manager__add" onSubmit={add}>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="新分类"
          aria-label="新分类名称"
        />
        <button type="submit" className="button button--ink button--small" disabled={busy || !name.trim()}>
          <Plus size={13} aria-hidden="true" />
          添加
        </button>
      </form>

      <ul className="category-manager__list">
        {categories.map((category) => (
          <li key={category.id}>
            {editingId === category.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  aria-label={`修改 ${category.name}`}
                />
                <button type="button" className="category-manager__icon" onClick={() => void save(category.id)} disabled={busy}>
                  <Check size={13} aria-hidden="true" />
                  <span className="sr-only">保存</span>
                </button>
                <button
                  type="button"
                  className="category-manager__icon"
                  onClick={() => {
                    setEditingId('')
                    setEditingName('')
                  }}
                >
                  <X size={13} aria-hidden="true" />
                  <span className="sr-only">取消</span>
                </button>
              </>
            ) : (
              <>
                <strong>{category.name}</strong>
                <button
                  type="button"
                  className="category-manager__icon"
                  onClick={() => {
                    setEditingId(category.id)
                    setEditingName(category.name)
                  }}
                >
                  <Pencil size={12} aria-hidden="true" />
                  <span className="sr-only">改名</span>
                </button>
                <button
                  type="button"
                  className="category-manager__remove"
                  onClick={() => void remove(category.id)}
                  disabled={busy}
                >
                  删
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
