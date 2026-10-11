import express from 'express'
import multer from 'multer'
import { extractBestIcon } from './pe-icon.js'
import { buildTscn } from './tscn.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 128 * 1024 * 1024 } })

// --- Apple App Store (public iTunes Search API) ---
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function searchItunes(term, limit) {
  const key = `${term}|${limit}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.games
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&media=software&entity=software&limit=${limit}`
  const r = await fetch(url, { headers: { 'User-Agent': 'fusion-console/1.0' } })
  if (!r.ok) throw new Error(`itunes ${r.status}`)
  const data = await r.json()
  const games = (data.results || [])
    .filter(x => x.wrapperType === 'software' && x.trackName)
    .map(x => ({
      id: x.trackId,
      name: x.trackName,
      developer: x.artistName || 'Unknown',
      art: x.artworkUrl512 || (x.artworkUrl100 || '').replace('100x100bb', '512x512bb') || '',
      url: x.trackViewUrl || '',
      price: x.formattedPrice || '',
      rating: x.averageUserRating || 0,
      ratings: x.userRatingCount || 0,
      genre: (x.genres && x.genres[0]) || '',
      description: x.description || '',
    }))
  cache.set(key, { t: Date.now(), games })
  return games
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/store', async (req, res) => {
  try {
    const term = String(req.query.term || 'games').slice(0, 80)
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 50)
    res.json({ games: await searchItunes(term, limit) })
  } catch {
    res.status(502).json({ error: 'store unavailable' })
  }
})

const FEATURED = [
  ['action games', 'Action'],
  ['puzzle games', 'Puzzle & Mind'],
  ['racing games', 'Racing'],
  ['strategy games', 'Strategy'],
  ['adventure games', 'Adventure'],
]

app.get('/api/store/featured', async (_req, res) => {
  const rows = await Promise.all(FEATURED.map(async ([term, title]) => {
    try {
      return { title, games: await searchItunes(term, 14) }
    } catch {
      return { title, games: [] }
    }
  }))
  res.json({ rows })
})

// --- EXE icon extraction (transient: nothing is persisted server-side) ---
const exeUpload = (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (!err) return next()
    const tooBig = err.code === 'LIMIT_FILE_SIZE'
    res.status(tooBig ? 413 : 400).json({ error: tooBig ? 'file too large (max 128 MB)' : 'upload failed' })
  })
}

app.post('/api/exe-icon', exeUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const name = req.file.originalname.replace(/\.exe$/i, '')
  try {
    const png = extractBestIcon(req.file.buffer)
    res.json({ name, icon: png ? `data:image/png;base64,${png.toString('base64')}` : null })
  } catch {
    res.json({ name, icon: null })
  }
})

// --- .tscn export ---
app.get('/api/tscn', (req, res) => {
  let state = null
  try {
    const b64 = String(req.query.d || '').replace(/-/g, '+').replace(/_/g, '/')
    state = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch {}
  if (!state || typeof state !== 'object') return res.status(400).send('invalid scene data')
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="fusion-console.tscn"')
  res.send(buildTscn(state))
})

const port = process.env.PORT || 8000
app.listen(port, '0.0.0.0', () => console.log(`fusion api listening on :${port}`))
