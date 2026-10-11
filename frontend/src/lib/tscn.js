export function encodeScene(state) {
  const json = JSON.stringify(state)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeScene(code) {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64)
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export const tscnDownloadPath = state => `/api/tscn?d=${encodeScene(state)}`
export const tscnDownloadLink = state => `${location.origin}${tscnDownloadPath(state)}`
export const restoreLink = state => `${location.origin}/?scene=${encodeScene(state)}`
