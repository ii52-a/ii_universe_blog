import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readStorage, sleep, writeStorage, removeStorage } from '../lib/storage'

export interface User {
  id: string
  name: string
  email: string
  handle: string
  bio: string
  location: string
  website: string
  avatar?: string
  avatarColor: string
  joinedAt: string
}

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'id' | 'email' | 'joinedAt'>>) => Promise<User>
}

const USER_KEY = 'user.v1'
const AuthContext = createContext<AuthContextValue | null>(null)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const demoUser: User = {
  id: 'demo-chichi',
  name: '迟迟',
  email: 'hello@halfday.club',
  handle: 'chichi',
  bio: '住在杭州，写一些不着急的事。',
  location: '杭州',
  website: 'halfday.club',
  avatarColor: '#FFD84D',
  joinedAt: '2024-11-02T10:00:00+08:00',
}

const colors = ['#FFD84D', '#FFB4A2', '#BFDBFE', '#BBF7D0', '#E9D5FF', '#FBCFE8']

export function handleFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
  return cleaned || 'islander'
}

function normalizeUser(user: User): User {
  if (user.handle) return user
  return { ...user, handle: handleFromEmail(user.email) }
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return '无名岛民'
  return cleaned.slice(0, 12)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = readStorage<User | null>(USER_KEY, null)
    if (!stored) return null
    return normalizeUser(stored)
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    const onStorage = (event: StorageEvent) => {
      if (event.key === `halfday.${USER_KEY}`) {
        const next = readStorage<User | null>(USER_KEY, null)
        setUser(next ? normalizeUser(next) : null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback((next: User | null) => {
    setUser(next)
    if (next) writeStorage(USER_KEY, next)
    else removeStorage(USER_KEY)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      await sleep(680)
      const normalized = email.trim().toLowerCase()
      if (!emailPattern.test(normalized)) throw new Error('请输入有效的邮箱地址。')
      if (password.length < 6) throw new Error('密码至少需要 6 位。')

      const stored = readStorage<User | null>(USER_KEY, null)
      if (stored && stored.email.toLowerCase() === normalized) {
        const existing = normalizeUser(stored)
        persist(existing)
        return existing
      }

      if (normalized === demoUser.email) {
        persist(demoUser)
        return demoUser
      }

      const now = new Date()
      const created: User = {
        id: `user-${now.getTime().toString(36)}`,
        name: nameFromEmail(normalized),
        email: normalized,
        handle: handleFromEmail(normalized),
        bio: '',
        location: '',
        website: '',
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        joinedAt: now.toISOString(),
      }
      persist(created)
      return created
    },
    [persist],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await sleep(760)
      const normalized = email.trim().toLowerCase()
      const cleanName = name.trim()
      if (cleanName.length < 2) throw new Error('名字至少写两个字。')
      if (cleanName.length > 16) throw new Error('名字最多 16 个字。')
      if (!emailPattern.test(normalized)) throw new Error('请输入有效的邮箱地址。')
      if (password.length < 6) throw new Error('密码至少需要 6 位。')

      const now = new Date()
      const created: User = {
        id: `user-${now.getTime().toString(36)}`,
        name: cleanName,
        email: normalized,
        handle: handleFromEmail(normalized),
        bio: '',
        location: '',
        website: '',
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        joinedAt: now.toISOString(),
      }
      persist(created)
      return created
    },
    [persist],
  )

  const logout = useCallback(() => {
    persist(null)
  }, [persist])

  const updateUser = useCallback(
    async (patch: Partial<Omit<User, 'id' | 'email' | 'joinedAt'>>) => {
      await sleep(520)
      if (!user) throw new Error('请先登录。')
      if (patch.name !== undefined) {
        const clean = patch.name.trim()
        if (clean.length < 2) throw new Error('名字至少写两个字。')
        if (clean.length > 16) throw new Error('名字最多 16 个字。')
      }
      const next = { ...user, ...patch }
      persist(next)
      return next
    },
    [persist, user],
  )

  const value = useMemo(
    () => ({ user, ready, login, register, logout, updateUser }),
    [user, ready, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 AuthProvider 中使用')
  return context
}
