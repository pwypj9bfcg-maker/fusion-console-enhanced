import { useEffect, useRef, useState } from 'react'
import BootScreen from './components/BootScreen.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Store from './components/Store.jsx'
import Plugins from './components/Plugins.jsx'
import WallpaperPicker from './components/WallpaperPicker.jsx'
import ExportModal from './components/ExportModal.jsx'
import DetailModal from './components/DetailModal.jsx'
import { getWallpaper } from './lib/wallpapers.js'
import { decodeScene } from './lib/tscn.js'
import { runPlugin } from './lib/plugins.js'
import { extractExeIcon } from './api.js'

const DEFAULT_PROFILE = {
  wallpaperId: 'violet',
  customWallpaper: null,
  accent: '#8b5cf6',
  tiles: [],
  plugins: [],
}

const uid = () => Math.random().toString(36).slice(2, 10)

function fallbackIcon(name) {
  const clean = String(name || 'App').replace(/\.exe$/i, '').trim()
  const initials = clean.split(/[\s\-_.]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EX'
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 256, 256)
  grd.addColorStop(0, '#4c1d95')
  grd.addColorStop(1, '#9d174d')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = 'rgba(255,255,255,.94)'
  g.font = '700 92px system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(initials, 128, 132)
  return c.toDataURL('image/png')
}

function initState() {
  const scene = new URLSearchParams(window.location.search).get('scene')
  if (scene) {
    const s = decodeScene(scene)
    if (s && typeof s === 'object') return { ...DEFAULT_PROFILE, ...s }
  }
  try {
    const raw = localStorage.getItem('fusion.profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_PROFILE }
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [profile, setProfile] = useState(initState)
  const [toast, setToast] = useState(null)
  const [showWallpaper, setShowWallpaper] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [detail, setDetail] = useState(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const workers = useRef({})
  const toastTimer = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('fusion.profile', JSON.stringify(profile)) } catch {}
  }, [profile])

  const notify = msg => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  const stopPlugin = id => {
    const w = workers.current[id]
    if (w) { w.terminate(); delete workers.current[id] }
  }

  const startPlugin = (plugin, onEvent) => {
    stopPlugin(plugin.id)
    workers.current[plugin.id] = runPlugin(plugin.code, ev => onEvent(plugin.id, ev))
  }

  const handlePluginEvent = (id, ev) => {
    setProfile(p => {
      const plugins = p.plugins.map(pl => {
        if (pl.id !== id) return pl
        if (ev.type === 'widget' && ev.widget) {
          const widgets = [...(pl.widgets || []).filter(w => w.title !== ev.widget.title), ev.widget]
          return { ...pl, widgets }
        }
        return pl
      })
      if (ev.type === 'theme' && ev.theme && ev.theme.accent) return { ...p, plugins, accent: ev.theme.accent }
      if (ev.type === 'notify' && ev.note) notify(String(ev.note))
      return { ...p, plugins }
    })
  }

  // (re)start enabled plugins once on load
  useEffect(() => {
    const handleEvent = (id, ev) => handlePluginEvent(id, ev)
    profile.plugins.filter(pl => pl.enabled).forEach(pl => startPlugin(pl, handleEvent))
    return () => {
      Object.values(workers.current).forEach(w => w && w.terminate())
      workers.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const importExe = async file => {
    if (!file) return
    notify('Reading ' + file.name + ' …')
    try {
      const { icon, name } = await extractExeIcon(file)
      const label = name || file.name.replace(/\.exe$/i, '')
      const tile = { id: uid(), name: label, icon: icon || fallbackIcon(label), kind: 'exe' }
      setProfile(p => ({ ...p, tiles: [tile, ...p.tiles] }))
      notify(label + (icon ? ' imported with its icon' : ' imported'))
    } catch (err) {
      notify(err && err.message === 'file too large (max 128 MB)'
        ? 'That EXE is too large — the limit is 128 MB'
        : 'Could not read that EXE')
    }
  }

  const installGame = game => {
    setProfile(p => {
      if (p.tiles.some(t => t.kind === 'store' && t.meta && String(t.meta.id) === String(game.id))) return p
      const tile = { id: uid(), name: game.name, icon: game.art, kind: 'store', meta: { id: game.id } }
      return { ...p, tiles: [tile, ...p.tiles] }
    })
    notify(game.name + ' added to your library')
  }

  const addPlugin = (name, code) => {
    if (!code || !code.trim()) return
    const plugin = { id: uid(), name: name || 'Untitled plugin', code, enabled: true, widgets: [] }
    setProfile(p => ({ ...p, plugins: [plugin, ...p.plugins] }))
    startPlugin(plugin, handlePluginEvent)
    notify(plugin.name + ' enabled')
  }

  const togglePlugin = id => {
    const pl = profile.plugins.find(x => x.id === id)
    if (!pl) return
    const enabled = !pl.enabled
    setProfile(p => ({
      ...p,
      plugins: p.plugins.map(x => (x.id === id ? { ...x, enabled } : x)),
      accent: enabled ? p.accent : '#8b5cf6',
    }))
    if (enabled) startPlugin({ ...pl, enabled: true, widgets: [] }, handlePluginEvent)
    else stopPlugin(id)
  }

  const removePlugin = id => {
    stopPlugin(id)
    setProfile(p => ({ ...p, plugins: p.plugins.filter(x => x.id !== id) }))
  }

  const pickWallpaper = (id, custom) => {
    setProfile(p => ({ ...p, wallpaperId: id || p.wallpaperId, customWallpaper: custom }))
    setShowWallpaper(false)
  }

  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect()
    setParallax({ x: e.clientX / r.width - 0.5, y: e.clientY / r.height - 0.5 })
  }

  const wp = getWallpaper(profile.wallpaperId, profile.customWallpaper)

  return (
    <div
      className="app"
      style={{ '--accent': profile.accent, '--mx': parallax.x, '--my': parallax.y }}
      onMouseMove={onMove}
    >
      <div className="wp" style={{ background: wp.css }} />
      <div className="orb orb-a" /><div className="orb orb-b" />
      <div className="grain" /><div className="vignette" />
      {booting && <BootScreen onDone={() => setBooting(false)} />}
      <TopBar page={page} setPage={setPage} onWallpaper={() => setShowWallpaper(true)} onExport={() => setShowExport(true)} />
      <main className="stage">
        {page === 'dashboard' && (
          <Dashboard key="dashboard" profile={profile} onImportFile={importExe} onOpenTile={setDetail} goStore={() => setPage('store')} />
        )}
        {page === 'store' && (
          <Store key="store" installed={profile.tiles} onInstall={installGame} onOpen={g => setDetail(g)} />
        )}
        {page === 'plugins' && (
          <Plugins key="plugins" profile={profile} onAdd={addPlugin} onToggle={togglePlugin} onRemove={removePlugin} />
        )}
      </main>
      {showWallpaper && <WallpaperPicker profile={profile} onPick={pickWallpaper} onClose={() => setShowWallpaper(false)} />}
      {showExport && <ExportModal profile={profile} notify={notify} onClose={() => setShowExport(false)} />}
      {detail && (
        <DetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onLaunch={name => { setDetail(null); notify('Launching ' + name + ' … (simulated)') }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
