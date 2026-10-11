export async function fetchFeatured() {
  const r = await fetch('/api/store/featured')
  if (!r.ok) throw new Error('store unavailable')
  return r.json()
}

export async function searchStore(term) {
  const r = await fetch(`/api/store?term=${encodeURIComponent(term)}`)
  if (!r.ok) throw new Error('search failed')
  return r.json()
}

export async function extractExeIcon(file) {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/exe-icon', { method: 'POST', body: fd })
  if (!r.ok) {
    let msg = 'icon extraction failed'
    try { msg = (await r.json()).error || msg } catch {}
    throw new Error(msg)
  }
  return r.json()
}
