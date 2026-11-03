/** 同一套矢量形态用于作品索引和无 WebGL 时的静态封面。 */
export function StudyGlyph({ study, className = '' }: { study: number; className?: string }) {
  return (
    <svg className={`unform-glyph ${className}`} viewBox="0 0 160 120" fill="none" aria-hidden="true">
      {study === 0 && Array.from({ length: 15 }, (_, i) => (
        <ellipse key={i} cx="80" cy="60" rx={42 - i * .5} ry={20 + i * 1.4}
          transform={`rotate(${i * 12} 80 60)`} stroke="currentColor" strokeWidth=".8" opacity={.3 + i * .045} />
      ))}
      {study === 1 && Array.from({ length: 200 }, (_, i) => {
        const a = i * 2.39996
        const r = 44 * Math.sqrt(i / 200)
        return <circle key={i} cx={80 + Math.cos(a) * r} cy={60 + Math.sin(a) * r}
          r={.7 + (i % 3) * .3} fill="currentColor" opacity={.4 + (i % 5) * .15} />
      })}
      {study === 2 && Array.from({ length: 19 }, (_, i) => (
        <ellipse key={i} cx="80" cy="60" rx="48" ry={10 + i * 1.55}
          transform={`rotate(${-48 + i * 5} 80 60)`} stroke="currentColor" strokeWidth=".8" opacity=".8" />
      ))}
    </svg>
  )
}
