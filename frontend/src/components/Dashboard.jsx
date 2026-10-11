import { useRef } from 'react'
import Clock from './Clock.jsx'
import Icon, { ICONS } from './Icon.jsx'

export default function Dashboard({ profile, onImportFile, onOpenTile, goStore }) {
  const file = useRef(null)
  return (
    <section className="page">
      <header className="hero">
        <Clock big />
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => file.current && file.current.click()}>
            <Icon d={ICONS.download} />Import EXE
          </button>
          <button className="btn" onClick={goStore}>
            <Icon d={ICONS.store} />Browse Store
          </button>
          <input
            ref={file}
            type="file"
            accept=".exe"
            hidden
            onChange={e => { onImportFile(e.target.files[0]); e.target.value = '' }}
          />
        </div>
      </header>
      <div className="tiles">
        {profile.tiles.map((t, i) => (
          <button key={t.id} className="tile" style={{ '--i': i }} onClick={() => onOpenTile(t)}>
            {t.icon
              ? <img src={t.icon} alt={t.name} />
              : <span className="tile-fallback">{t.name.slice(0, 2).toUpperCase()}</span>}
            <span className="tile-name">{t.name}</span>
          </button>
        ))}
        <button className="tile tile-add" style={{ '--i': profile.tiles.length }} onClick={goStore}>
          <span>+</span>
          <span className="tile-name">Get more games</span>
        </button>
      </div>
      {!profile.tiles.length && (
        <p className="empty-hint">Your library is empty — import an EXE or grab something from the store.</p>
      )}
    </section>
  )
}
