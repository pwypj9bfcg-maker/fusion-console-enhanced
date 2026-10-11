// PE (Windows .exe) icon extractor — parses RT_GROUP_ICON / RT_ICON resources
// and returns the best icon as a PNG buffer. Pure Node, no native deps.
import zlib from 'node:zlib'

// --- PNG encoder ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

export function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- PE parsing ---
function parsePE(buf) {
  if (buf.length < 0x40 || buf.readUInt16LE(0) !== 0x5A4D) return null
  const peOff = buf.readUInt32LE(0x3C)
  if (peOff + 24 > buf.length || buf.readUInt32BE(peOff) !== 0x50450000) return null
  const numSections = buf.readUInt16LE(peOff + 6)
  const optSize = buf.readUInt16LE(peOff + 20)
  const optOff = peOff + 24
  if (optOff + optSize > buf.length) return null
  const magic = buf.readUInt16LE(optOff)
  const dirBase = optOff + (magic === 0x20B ? 112 : 96)
  if (dirBase + 24 > buf.length) return null
  const resRVA = buf.readUInt32LE(dirBase + 16) // data directory index 2
  const sections = []
  const st = optOff + optSize
  for (let i = 0; i < numSections; i++) {
    const o = st + i * 40
    if (o + 40 > buf.length) break
    sections.push({
      va: buf.readUInt32LE(o + 12),
      vs: buf.readUInt32LE(o + 8),
      rs: buf.readUInt32LE(o + 16),
      raw: buf.readUInt32LE(o + 20),
    })
  }
  const r2o = rva => {
    for (const s of sections) {
      const size = Math.max(s.vs, s.rs)
      if (size && rva >= s.va && rva < s.va + size) return rva - s.va + s.raw
    }
    return -1
  }
  return { resRVA, r2o }
}

function readDirEntries(buf, resOff, off) {
  const named = buf.readUInt16LE(resOff + off + 12)
  const idd = buf.readUInt16LE(resOff + off + 14)
  const count = named + idd
  const entries = []
  for (let i = 0; i < count; i++) {
    const e = resOff + off + 16 + i * 8
    if (e + 8 > buf.length) break
    const field = buf.readUInt32LE(e)
    const val = buf.readUInt32LE(e + 4)
    entries.push({
      id: field & 0x7FFFFFFF,
      isName: (field >>> 31) === 1,
      isDir: (val >>> 31) === 1,
      offset: val & 0x7FFFFFFF,
    })
  }
  return entries
}

function collectIconsAndGroups(buf) {
  const pe = parsePE(buf)
  if (!pe) return { icons: new Map(), groups: [] }
  const resOff = pe.r2o(pe.resRVA)
  const icons = new Map()
  const groups = []
  if (resOff < 0 || resOff + 16 > buf.length) return { icons, groups }
  for (const type of readDirEntries(buf, resOff, 0)) {
    if (type.isName || !type.isDir) continue
    if (type.id !== 3 && type.id !== 14) continue // RT_ICON, RT_GROUP_ICON
    for (const name of readDirEntries(buf, resOff, type.offset)) {
      if (name.isName || !name.isDir) continue
      for (const leaf of readDirEntries(buf, resOff, name.offset)) {
        if (leaf.isDir) continue
        const d = resOff + leaf.offset
        if (d + 8 > buf.length) continue
        const rva = buf.readUInt32LE(d)
        const size = buf.readUInt32LE(d + 4)
        const o = pe.r2o(rva)
        if (o < 0 || o + size > buf.length) continue
        const img = buf.subarray(o, o + size)
        if (type.id === 3) icons.set(name.id, img)
        else groups.push({ id: name.id, data: img })
      }
    }
  }
  return { icons, groups }
}

// Convert one RT_ICON image (PNG or BMP-style) to PNG
function decodeIconImage(img) {
  if (img.length >= 8 && img[0] === 0x89 && img[1] === 0x50 && img[2] === 0x4E && img[3] === 0x47) return img
  if (img.length < 40 || img.readUInt32LE(0) !== 40) return null
  const width = img.readUInt32LE(4)
  const height = img.readUInt32LE(8) / 2 // XOR mask + AND mask stacked
  const bpp = img.readUInt16LE(14)
  if (!width || !height || height > 1024 || width > 1024) return null
  const clrUsed = img.readUInt32LE(32) || (bpp <= 8 ? 1 << bpp : 0)
  const palSize = bpp <= 8 ? clrUsed * 4 : 0
  const pxOff = 40 + palSize
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y // bottom-up rows
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 255
      if (bpp === 32) {
        const i = pxOff + srcY * rowSize + x * 4
        b = img[i]; g = img[i + 1]; r = img[i + 2]; a = img[i + 3]
      } else if (bpp === 24) {
        const i = pxOff + srcY * rowSize + x * 3
        b = img[i]; g = img[i + 1]; r = img[i + 2]
      } else if (bpp === 8) {
        const i = pxOff + srcY * rowSize + x
        const p = 40 + i * 4
        b = img[p]; g = img[p + 1]; r = img[p + 2]
      } else if (bpp === 4) {
        const i = pxOff + srcY * rowSize + (x >> 1)
        const nib = x % 2 ? img[i] & 0xF : img[i] >> 4
        const p = 40 + nib * 4
        b = img[p]; g = img[p + 1]; r = img[p + 2]
      } else if (bpp === 1) {
        const i = pxOff + srcY * rowSize + (x >> 3)
        const bit = (img[i] >> (7 - (x & 7))) & 1
        const p = 40 + bit * 4
        b = img[p]; g = img[p + 1]; r = img[p + 2]
      } else {
        return null
      }
      const o = (y * width + x) * 4
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a
    }
  }
  return encodePNG(width, height, out)
}

export function extractBestIcon(buf) {
  const { icons, groups } = collectIconsAndGroups(buf)
  const candidates = []
  for (const g of groups) {
    if (g.data.length < 6) continue
    const count = g.data.readUInt16LE(4)
    for (let i = 0; i < count; i++) {
      const o = 6 + i * 14
      if (o + 14 > g.data.length) break
      const w = g.data[o] || 256
      const h = g.data[o + 1] || 256
      const id = g.data.readUInt16LE(o + 12)
      const img = icons.get(id)
      if (img) candidates.push({ score: w * h, img })
    }
  }
  if (!candidates.length) {
    for (const img of icons.values()) candidates.push({ score: img.length, img })
  }
  candidates.sort((a, b) => b.score - a.score)
  for (const c of candidates) {
    const png = decodeIconImage(c.img)
    if (png) return png
  }
  return null
}
