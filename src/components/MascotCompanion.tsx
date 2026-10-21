import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { Minus, Sparkles } from 'lucide-react'
import { readStorage, writeStorage } from '../lib/storage'
import { useAuth } from '../context/AuthContext'
import { Mascot } from './Mascot'

const idleMessages = [
  '今天也没干什么大事。',
  '要不要出去走走？',
  '桂花味的风，闻到了吗？',
  '先喝口水吧。',
  '坐着发呆，也算正事。',
  '天黑之前，把这一页读完。',
]

function routeMessage(pathname: string, name?: string) {
  if (pathname === '/') return `${name ? `${name}，` : ''}回来啦。今天想读哪页？`
  if (pathname.startsWith('/sunset')) return '今天的日落，看到了吗？'
  if (pathname.startsWith('/u/')) return '这一页是你呀。'
  if (pathname.startsWith('/login')) return '我在门口等你。'
  if (pathname.startsWith('/me')) return '座位已经给你留好了。'
  if (pathname.startsWith('/about')) return '这里讲的是半日，也讲我。'
  if (pathname.startsWith('/articles/')) return '这篇我读过两遍。'
  if (pathname.startsWith('/articles')) return '慢慢翻，不着急。'
  return '随便逛逛吧。'
}

export function MascotCompanion() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [hidden, setHidden] = useState(() => readStorage<boolean>('mascot-hidden.v1', false))
  const [message, setMessage] = useState(() => routeMessage(pathname, user?.name))
  const [bubble, setBubble] = useState(true)
  const [celebrating, setCelebrating] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [shift, setShift] = useState(0)
  const [lean, setLean] = useState(0)
  const [patCount, setPatCount] = useState(0)
  const bubbleTimer = useRef<number | undefined>(undefined)
  const celebrateTimer = useRef<number | undefined>(undefined)
  const scrollTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setMessage(routeMessage(pathname, user?.name))
    setBubble(true)
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(false), 6200)
    return () => window.clearTimeout(bubbleTimer.current)
  }, [pathname, user?.name])

  useEffect(() => {
    let frame = 0
    let lastY = window.scrollY
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progress = max > 0 ? window.scrollY / max : 0
        setShift(-progress * (window.innerWidth <= 640 ? 46 : 132))
        const delta = window.scrollY - lastY
        setLean(Math.max(-3.5, Math.min(3.5, delta * 0.04)))
        lastY = window.scrollY
        setScrolling(true)
        window.clearTimeout(scrollTimer.current)
        scrollTimer.current = window.setTimeout(() => {
          setScrolling(false)
          setLean(0)
        }, 190)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      window.clearTimeout(scrollTimer.current)
    }
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(celebrateTimer.current)
      window.clearTimeout(bubbleTimer.current)
    },
    [],
  )

  const pat = () => {
    const next = idleMessages[(patCount + 1) % idleMessages.length]
    setPatCount((count) => count + 1)
    setMessage(next)
    setBubble(true)
    setCelebrating(true)
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(false), 7200)
    window.clearTimeout(celebrateTimer.current)
    celebrateTimer.current = window.setTimeout(() => setCelebrating(false), 900)
  }

  const hide = () => {
    setHidden(true)
    writeStorage('mascot-hidden.v1', true)
  }

  const show = () => {
    setHidden(false)
    writeStorage('mascot-hidden.v1', false)
    setBubble(true)
    setMessage('我又回来了。')
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(false), 4200)
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/me') ||
    pathname.startsWith('/write') ||
    pathname.startsWith('/space') ||
    pathname.startsWith('/review')
  ) {
    return null
  }

  if (hidden) {
    return (
      <button type="button" className="mascot-reopen" onClick={show} aria-label="叫小满出来">
        <span className="mascot-reopen__face" aria-hidden="true">
          <i />
          <i />
        </span>
        小满
      </button>
    )
  }

  const style = {
    '--toy-shift': `${shift}px`,
    '--toy-lean': `${lean}deg`,
  } as CSSProperties

  return (
    <aside
      className={`mascot-companion${celebrating ? ' is-celebrating' : ''}${scrolling ? ' is-scrolling' : ''}`}
      style={style}
      aria-label="小满，半日的玩偶"
    >
      <button type="button" className="mascot-companion__hide" onClick={hide} aria-label="让小满休息">
        <Minus size={12} aria-hidden="true" />
      </button>

      <div className={`mascot-companion__bubble${bubble ? '' : ' is-hidden'}`} aria-live="polite">
        {message}
        <span className="mascot-companion__spark" aria-hidden="true">
          <Sparkles size={11} />
        </span>
      </div>

      <span className="mascot-companion__perch" aria-hidden="true" />

      <div className="mascot-companion__body">
        <span className="mascot-companion__sparkle mascot-companion__sparkle--one" aria-hidden="true">
          ✳
        </span>
        <span className="mascot-companion__sparkle mascot-companion__sparkle--two" aria-hidden="true">
          ·
        </span>
        <Mascot onPat={pat} className="mascot--companion" />
      </div>

      <span className="mascot-companion__tag" aria-hidden="true">
        {user ? `${user.name} 的邻居` : '看店中'}
      </span>
    </aside>
  )
}
