import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type ApiUser } from '../lib/backend'
import { readStorage, removeStorage, writeStorage } from '../lib/storage'

export interface User {
  id: string
  name: string
  username: string
  email: string
  handle: string
  role: 'member' | 'admin'
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
  login: (
    identifier: string,
    password: string,
    options?: { remember?: boolean },
  ) => Promise<User>
  register: (input: {
    username: string
    email: string
    password: string
    code: string
  }) => Promise<User>
  logout: () => Promise<void>
  updateUser: (
    patch: Partial<Omit<User, 'id' | 'email' | 'joinedAt' | 'role'>>,
  ) => Promise<User>
}

const REMEMBER_KEY = 'remember-email.v1'
const AuthContext = createContext<AuthContextValue | null>(null)

export const demoUser: User = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'DeepS先生',
  username: 'DeepS先生',
  email: 'hello@halfday.club',
  handle: 'deepseek',
  role: 'member',
  bio: 'DeepS先生，在杭州写一些不着急的事。',
  location: '杭州',
  website: 'halfday.club',
  avatarColor: '#BFD2FF',
  joinedAt: '2024-11-02T10:00:00+08:00',
}

export function rememberedEmail() {
  return readStorage<string>(REMEMBER_KEY, '')
}

function mapUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.username,
    username: apiUser.username,
    email: apiUser.email,
    handle: apiUser.handle,
    role: apiUser.role,
    bio: apiUser.bio,
    location: apiUser.location,
    website: apiUser.website,
    avatar: apiUser.avatar,
    avatarColor: apiUser.avatarColor,
    joinedAt: apiUser.joinedAt,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    authApi
      .me()
      .then(({ user: apiUser }) => {
        if (!cancelled) setUser(mapUser(apiUser))
      })
      .catch((error: unknown) => {
        if (!cancelled && typeof error === 'object' && error && 'status' in error && error.status !== 401) {
          console.warn('[auth] session check failed', error)
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      options: { remember?: boolean } = {},
    ) => {
      const remember = options.remember ?? false
      const result = await authApi.login({ identifier, password, remember })
      const next = mapUser(result.user)
      setUser(next)
      if (remember) writeStorage(REMEMBER_KEY, next.email)
      else removeStorage(REMEMBER_KEY)
      return next
    },
    [],
  )

  const register = useCallback(
    async (input: { username: string; email: string; password: string; code: string }) => {
      const result = await authApi.register(input)
      const next = mapUser(result.user)
      setUser(next)
      return next
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback(
    async (patch: Partial<Omit<User, 'id' | 'email' | 'joinedAt' | 'role'>>) => {
      if (!user) throw new Error('请先登录')
      const result = await authApi.updateProfile({
        username: patch.username ?? patch.name,
        bio: patch.bio,
        location: patch.location,
        website: patch.website,
        avatarColor: patch.avatarColor,
        avatarUrl: patch.avatar === null ? null : patch.avatar,
      })
      const next = mapUser(result.user)
      setUser(next)
      return next
    },
    [user],
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
