/**
 * 权限页
 * 职责：ii52A1 给账号逐项下发权限。
 * 样式：src/css/pages/permissions.css
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowUpRight, Check, ClipboardCheck, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  permissionsApi,
  type Permission,
  type PermissionUser,
} from '../lib/backend'
import { Avatar } from '../components/Avatar'

type CatalogItem = { key: Permission; label: string; description: string }

function orderPermissions(keys: Permission[], catalog: CatalogItem[]): Permission[] {
  const set = new Set(keys)
  return catalog.map((item) => item.key).filter((key) => set.has(key))
}

export function PermissionsPage() {
  usePageTitle('权限管理')
  const { user, ready, can } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<PermissionUser[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')

  useEffect(() => {
    if (!ready || !user || user.role !== 'admin') return
    let cancelled = false
    setLoading(true)
    permissionsApi
      .list()
      .then((data) => {
        if (cancelled) return
        setUsers(data.users)
        setCatalog(data.catalog)
        setDrafts(
          Object.fromEntries(data.users.map((item) => [item.id, [...item.permissions]])),
        )
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : '权限列表没有加载出来。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ready, user])

  const orderedCatalog = useMemo(() => catalog, [catalog])

  if (!ready) {
    return (
      <div className="permissions-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在确认权限…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login?from=/permissions" replace />

  if (user.role !== 'admin') {
    return (
      <div className="permissions-page">
        <div className="page-container review-denied">
          <Link className="text-link" to="/space">
            回到我的空间
          </Link>
        </div>
      </div>
    )
  }

  const toggle = (target: PermissionUser, key: Permission) => {
    setDrafts((current) => {
      const existing = current[target.id] ?? []
      const next = existing.includes(key)
        ? existing.filter((item) => item !== key)
        : orderPermissions([...existing, key], orderedCatalog)
      return { ...current, [target.id]: next }
    })
  }

  const dirty = (target: PermissionUser) =>
    JSON.stringify(drafts[target.id] ?? []) !== JSON.stringify(target.permissions)

  const save = async (target: PermissionUser) => {
    setSaving(target.id)
    try {
      const result = await permissionsApi.update(target.id, drafts[target.id] ?? [])
      setUsers((current) =>
        current.map((item) =>
          item.id === target.id ? { ...item, permissions: result.user.permissions } : item,
        ),
      )
      setDrafts((current) => ({ ...current, [target.id]: result.user.permissions }))
      showToast(`@${target.handle} 的权限更新了。`)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '权限没有保存。', 'error')
    } finally {
      setSaving('')
    }
  }

  return (
    <div className="permissions-page">
      <div className="page-container">
        <header className="permissions-head">
          <div className="permissions-head__actions">
            {can('posts.review') && (
              <Link className="text-link" to="/review">
                审核队列 <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            )}
            <Link className="text-link" to="/space">
              我的空间 <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </header>
        {loading ? (
          <div className="write-loading">
            <span className="spinner" aria-hidden="true" />
            正在读取账号…
          </div>
        ) : error ? (
          <div className="review-empty">
            <p>{error}</p>
            <button type="button" className="text-link" onClick={() => window.location.reload()}>
              重新加载
            </button>
          </div>
        ) : (
          <div className="permission-list">
            {users.map((item) => {
              const isAdminRow = item.role === 'admin'
              const current = drafts[item.id] ?? []
              return (
                <article className={`permission-card${isAdminRow ? ' permission-card--admin' : ''}`} key={item.id}>
                  <div className="permission-card__person">
                    <Avatar name={item.username} color={item.avatarColor} size="md" />
                    <div>
                      <strong>{item.username}</strong>
                      <span>
                        @{item.handle}
                        {isAdminRow && (
                          <em>
                            <KeyRound size={11} aria-hidden="true" />
                            ii52A1 · 全部权限
                          </em>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="permission-card__checks">
                    {catalog.map((permission) => (
                      <label
                        key={permission.key}
                        className={`permission-check${isAdminRow ? ' is-locked' : ''}`}
                        title={permission.description}
                      >
                        <input
                          type="checkbox"
                          checked={isAdminRow || current.includes(permission.key)}
                          disabled={isAdminRow}
                          onChange={() => toggle(item, permission.key)}
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="permission-card__actions">
                    {isAdminRow ? (
                      <span className="permission-card__note">
                        <ClipboardCheck size={13} aria-hidden="true" />
                        不可修改
                      </span>
                    ) : (
                      <>
                        {dirty(item) && <span className="permission-card__dirty">有改动</span>}
                        <button
                          type="button"
                          className="button button--ink button--small"
                          disabled={!dirty(item) || saving === item.id}
                          onClick={() => void save(item)}
                        >
                          <Check size={13} aria-hidden="true" />
                          {saving === item.id ? '保存中…' : '保存'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
