import { useRef, useState } from 'react'
import { PLUGIN_DOCS } from '../lib/plugins.js'

export default function Plugins({ profile, onAdd, onToggle, onRemove }) {
  const file = useRef(null)
  const [draft, setDraft] = useState('')

  const addFile = f => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => onAdd(f.name.replace(/\.(js|txt)$/i, ''), String(r.result))
    r.readAsText(f)
  }

  return (
    <section className="page">
      <div className="glass-panel">
        <h2>Plugins</h2>
        <p>Import your own JavaScript plugins — each one runs in a sandboxed worker with a tiny <code>fusion</code> API.</p>
        <div className="plugin-actions">
          <button className="btn btn-primary" onClick={() => file.current && file.current.click()}>Import plugin (.js)</button>
          <button className="btn" onClick={() => onAdd('Sample widget', PLUGIN_DOCS)}>Add sample</button>
          <input ref={file} type="file" accept=".js,.txt" hidden onChange={e => { addFile(e.target.files[0]); e.target.value = '' }} />
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="…or paste plugin code here"
          spellCheck={false}
        />
        <div className="plugin-actions">
          <button className="btn" onClick={() => { onAdd('Pasted plugin', draft); setDraft('') }} disabled={!draft.trim()}>
            Add pasted plugin
          </button>
        </div>
        <pre className="code">{PLUGIN_DOCS}</pre>
      </div>
      <div className="plugin-list">
        {profile.plugins.map(p => (
          <div className="glass-panel plugin" key={p.id}>
            <div className="plugin-head">
              <strong>{p.name}</strong>
              <label className="switch">
                <input type="checkbox" checked={p.enabled} onChange={() => onToggle(p.id)} />
                <i />
              </label>
              <button className="icon-btn" title="Remove" onClick={() => onRemove(p.id)}>✕</button>
            </div>
            {p.enabled && (p.widgets || []).map(w => (
              <div className="widget" key={w.title || Math.random()}>
                <strong>{w.title}</strong>
                <div dangerouslySetInnerHTML={{ __html: w.html }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
