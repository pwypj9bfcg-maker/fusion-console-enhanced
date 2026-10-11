import { useRef } from 'react'
import Modal from './Modal.jsx'
import { WALLPAPERS } from '../lib/wallpapers.js'

export default function WallpaperPicker({ profile, onPick, onClose }) {
  const file = useRef(null)

  const upload = f => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 1920 / img.width)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        onPick(null, c.toDataURL('image/jpeg', 0.85))
      }
      img.src = String(r.result)
    }
    r.readAsDataURL(f)
  }

  return (
    <Modal title="Wallpaper" onClose={onClose}>
      <div className="wp-grid">
        {WALLPAPERS.map(w => (
          <button
            key={w.id}
            className={'wp-thumb' + (profile.wallpaperId === w.id && !profile.customWallpaper ? ' active' : '')}
            style={{ background: w.css }}
            onClick={() => onPick(w.id, null)}
          >
            <span>{w.name}</span>
          </button>
        ))}
      </div>
      <button className="btn" onClick={() => file.current && file.current.click()}>Upload custom image</button>
      <input ref={file} type="file" accept="image/*" hidden onChange={e => { upload(e.target.files[0]); e.target.value = '' }} />
    </Modal>
  )
}
