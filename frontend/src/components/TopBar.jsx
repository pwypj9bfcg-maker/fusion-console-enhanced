import Clock from './Clock.jsx'
import Icon, { ICONS } from './Icon.jsx'

const NAV = [
  ['dashboard', 'Home', ICONS.home],
  ['store', 'Store', ICONS.store],
  ['plugins', 'Plugins', ICONS.puzzle],
]

export default function TopBar({ page, setPage, onWallpaper, onExport }) {
  return (
    <header className="topbar">
      <div className="brand" onClick={() => setPage('dashboard')}>FUSION<span>CONSOLE</span></div>
      <nav>
        {NAV.map(([id, label, d]) => (
          <button key={id} className={'nav-btn' + (page === id ? ' active' : '')} onClick={() => setPage(id)}>
            <Icon d={d} size={16} />{label}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        <button className="icon-btn" title="Wallpaper" onClick={onWallpaper}><Icon d={ICONS.image} /></button>
        <button className="icon-btn" title="Export .tscn" onClick={onExport}><Icon d={ICONS.download} /></button>
        <Clock />
      </div>
    </header>
  )
}
