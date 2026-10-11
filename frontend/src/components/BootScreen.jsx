import { useEffect } from 'react'

export default function BootScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="boot">
      <div>
        <div className="boot-logo">FUSION<span>CONSOLE</span></div>
        <div className="boot-bar"><i /></div>
      </div>
    </div>
  )
}
