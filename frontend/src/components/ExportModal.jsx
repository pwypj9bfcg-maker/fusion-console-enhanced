import Modal from './Modal.jsx'
import { tscnDownloadPath, tscnDownloadLink, restoreLink } from '../lib/tscn.js'

export default function ExportModal({ profile, notify, onClose }) {
  const download = tscnDownloadPath(profile)
  const full = tscnDownloadLink(profile)
  const restore = restoreLink(profile)

  const copy = (text, label) => () => {
    try { navigator.clipboard.writeText(text) } catch {}
    notify(label + ' copied')
  }

  return (
    <Modal title="Export scene (.tscn)" onClose={onClose}>
      <p>Save your console layout as a Godot scene file, or copy a link to it.</p>
      <div className="link-row"><code>{full}</code></div>
      <div className="btn-row">
        <a className="btn btn-primary" href={download} download="fusion-console.tscn">Download .tscn</a>
        <button className="btn" onClick={copy(full, 'TSCN link')}>Copy .tscn link</button>
        <button className="btn" onClick={copy(restore, 'Restore link')}>Copy restore link</button>
      </div>
      <p className="hint">The restore link opens this console with your wallpaper, library and plugins intact. The .tscn pairs with a <code>fusion_console.gd</code> script exposing <code>wallpaper</code> and <code>accent</code>.</p>
    </Modal>
  )
}
