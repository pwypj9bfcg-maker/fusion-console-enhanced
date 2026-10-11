import { useEffect, useState } from 'react'

export default function Clock({ big }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className={'clock' + (big ? ' clock-big' : '')}>
      <div className="clock-time">{time}</div>
      {big && <div className="clock-date">{date}</div>}
    </div>
  )
}
