import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ShieldAlert } from 'lucide-react'

export function ExternalLinkGuard() {
  const [target, setTarget] = useState('')
  const [open, setOpen] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const element = event.target as Element | null
      const anchor = element?.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !/^https?:\/\//i.test(href)) return
      try {
        if (new URL(href).origin === window.location.origin) return
      } catch {
        return
      }
      event.preventDefault()
      setTarget(href)
      setOpen(true)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  let host = target
  try {
    host = new URL(target).hostname
  } catch {
    // Keep the raw target if the browser cannot parse it.
  }

  return (
    <div className="external-guard" role="presentation" onMouseDown={() => setOpen(false)}>
      <div className="external-guard__orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div
        className="external-guard__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-guard-title"
        aria-describedby="external-guard-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="external-guard__mark" aria-hidden="true">
          <ShieldAlert size={16} />
        </span>
        <span className="external-guard__eyebrow">EXTERNAL ROUTE</span>
        <h2 id="external-guard-title">
          走入黑夜中，
          <br />
          小道分叉。
        </h2>
        <p id="external-guard-desc">请保护个人财产和账号安全。</p>
        <code>{host}</code>
        <div className="external-guard__actions">
          <button
            type="button"
            className="external-guard__go"
            ref={confirmRef}
            onClick={() => {
              window.open(target, '_blank', 'noopener,noreferrer')
              setOpen(false)
            }}
          >
            继续前往 <ArrowUpRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="external-guard__stay" onClick={() => setOpen(false)}>
            留在半日
          </button>
        </div>
      </div>
    </div>
  )
}
