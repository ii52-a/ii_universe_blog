/**
 * 宇宙 logo
 * 职责：ii universe 轨道标记。
 * 样式：src/css/components/universe-mark.css
 */

export function UniverseMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`universe-mark ${className}`.trim()}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="22" fill="#1B1B18" />
      <ellipse
        cx="24"
        cy="24"
        rx="17.5"
        ry="8"
        fill="none"
        stroke="#FFD84D"
        strokeWidth="1.4"
        transform="rotate(-26 24 24)"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="17.5"
        ry="8"
        fill="none"
        stroke="#F0664F"
        strokeWidth="1.1"
        transform="rotate(36 24 24)"
      />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="20"
        fontStyle="italic"
        fontWeight="700"
        fill="#FBFBF8"
      >
        ii
      </text>
      <circle cx="40" cy="11" r="2.3" fill="#2449E8" />
    </svg>
  )
}
