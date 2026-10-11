import { useEffect, useRef, useState } from 'react'
import { fetchFeatured, searchStore } from '../api.js'
import Icon, { ICONS } from './Icon.jsx'

function StoreCard({ game, installed, progress, onGet, onOpen }) {
  return (
    <article className="store-card" onClick={onOpen}>
      <img src={game.art} alt={game.name} loading="lazy" />
      <div className="store-card-meta">
        <strong>{game.name}</strong>
        <span>{game.developer}</span>
      </div>
      <button
        className={'get-btn' + (installed ? ' installed' : '')}
        onClick={e => { e.stopPropagation(); onGet(game) }}
      >
        {progress != null
          ? <span className="get-ring" style={{ '--p': progress }} />
          : installed ? 'Installed' : 'GET'}
      </button>
    </article>
  )
}

export default function Store({ installed, onInstall, onOpen }) {
  const [rows, setRows] = useState(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [installing, setInstalling] = useState({})
  const timers = useRef({})

  const loadFeatured = () => {
    setFailed(false)
    fetchFeatured().then(d => setRows(d.rows)).catch(() => setFailed(true))
  }
  useEffect(loadFeatured, [])
  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), [])

  const isInstalled = g => installed.some(t => t.kind === 'store' && t.meta && String(t.meta.id) === String(g.id))

  const get = g => {
    if (isInstalled(g) || installing[g.id] != null) return
    const t0 = Date.now()
    setInstalling(s => ({ ...s, [g.id]: 0 }))
    timers.current[g.id] = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 900)
      setInstalling(s => ({ ...s, [g.id]: p }))
      if (p >= 1) {
        clearInterval(timers.current[g.id])
        setInstalling(s => { const { [g.id]: _, ...rest } = s; return rest })
        onInstall(g)
      }
    }, 60)
  }

  const submit = async e => {
    e.preventDefault()
    if (!q.trim()) { setResults(null); return }
    setSearching(true)
    setFailed(false)
    try {
      const d = await searchStore(q.trim())
      setResults(d.games)
    } catch {
      setFailed(true)
    } finally {
      setSearching(false)
    }
  }

  const shown = results ? [{ title: `Results for “${q.trim()}”`, games: results }] : rows

  return (
    <section className="page">
      <form className="store-search" onSubmit={submit}>
        <Icon d={ICONS.search} />
        <input
          placeholder="Search games, genres, developers…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {q && (
          <button type="button" className="icon-btn" onClick={() => { setQ(''); setResults(null) }}>
            <Icon d={ICONS.x} size={14} />
          </button>
        )}
      </form>
      {failed && (
        <div className="store-error">
          The store is unreachable right now.
          <button onClick={loadFeatured}>Retry</button>
        </div>
      )}
      {!rows && !failed && <div className="store-loading">Loading the store…</div>}
      {shown && shown.map(row => (
        <div className="row" key={row.title}>
          <h2>{row.title}</h2>
          <div className="row-scroll">
            {row.games.map(g => (
              <StoreCard
                key={g.id}
                game={g}
                installed={isInstalled(g)}
                progress={installing[g.id]}
                onGet={get}
                onOpen={() => onOpen(g)}
              />
            ))}
            {row.games.length === 0 && <span className="empty-hint">Nothing here right now.</span>}
          </div>
        </div>
      ))}
    </section>
  )
}
