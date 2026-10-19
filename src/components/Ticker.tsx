import { useClock } from '../hooks/useClock'

export function Ticker() {
  const clock = useClock()
  const items = [
    `${clock.monthLabel}${clock.dayLabel}，${clock.weekday}`,
    '新文：在便利店门口站了十分钟',
    '昨天有人留言：今天杭州降温了',
    '正在读《路上观察学》',
    `小满说：${clock.greeting}`,
    '宜绕远路，忌熬到两点',
    '慢慢来，比较快',
  ]

  return (
    <div className="ticker" aria-label="半日近况">
      <span className="ticker__badge">此刻</span>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <span className="ticker__group" key={copy} aria-hidden={copy === 1}>
              {items.map((item) => (
                <span className="ticker__item" key={`${copy}-${item}`}>
                  {item}
                  <i aria-hidden="true">✳</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
