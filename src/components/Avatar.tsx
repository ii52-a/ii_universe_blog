import type { CSSProperties } from 'react'

interface AvatarProps {
  name: string
  color?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name, color = '#FFD84D', src, size = 'md', className = '' }: AvatarProps) {
  const style = { '--avatar-color': color } as CSSProperties
  return (
    <span className={`avatar avatar--${size} ${className}`} style={style} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <span>{name.slice(0, 1)}</span>}
    </span>
  )
}

export function AvatarStack({
  people,
  size = 'sm',
}: {
  people: Array<{ name: string; color: string; initial: string; avatar?: string }>
  size?: AvatarProps['size']
}) {
  return (
    <span className="avatar-stack" aria-hidden="true">
      {people.map((person) => (
        <Avatar key={person.name} name={person.initial} color={person.color} src={person.avatar} size={size} />
      ))}
    </span>
  )
}
