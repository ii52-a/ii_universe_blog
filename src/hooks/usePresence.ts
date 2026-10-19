import { useEffect, useMemo, useState } from 'react'
import { onlinePeople } from '../data/comments'
import type { User } from '../context/AuthContext'

export function usePresence(user: User | null) {
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60000))

  useEffect(() => {
    const timer = window.setInterval(() => setMinute(Math.floor(Date.now() / 60000)), 45000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(() => {
    const count = 4 + (minute % 3) + (user ? 1 : 0)
    const visitorCount = Math.min(5, count - (user ? 1 : 0))
    const people = onlinePeople.slice(0, visitorCount)
    return {
      count,
      people,
      current: user
        ? {
            name: user.name,
            color: user.avatarColor,
            initial: user.name.slice(0, 1),
            avatar: user.avatar,
          }
        : null,
    }
  }, [minute, user])
}
