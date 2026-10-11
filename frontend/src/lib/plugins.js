// Plugins run in a sandboxed Web Worker with a tiny `fusion` API:
//   fusion.addWidget({ title, html })
//   fusion.setTheme({ accent })
//   fusion.notify('message')
export function runPlugin(code, onEvent) {
  const src =
    'const fusion = {\n' +
    '  addWidget: w => postMessage({ type: "widget", widget: w }),\n' +
    '  setTheme: t => postMessage({ type: "theme", theme: t }),\n' +
    '  notify: n => postMessage({ type: "notify", note: n }),\n' +
    '};\n' +
    '(function(){\n' + code + '\n})();'
  try {
    const worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })))
    worker.onmessage = e => onEvent && onEvent(e.data)
    worker.onerror = err => onEvent && onEvent({ type: 'notify', note: 'Plugin error: ' + (err.message || 'unknown') })
    return worker
  } catch (err) {
    onEvent && onEvent({ type: 'notify', note: 'Plugin error: ' + err })
    return null
  }
}

export const PLUGIN_DOCS = `// Fusion plugin — plain JavaScript, runs in a sandboxed worker.
// API:
//   fusion.addWidget({ title, html })
//   fusion.setTheme({ accent })
//   fusion.notify('message')

fusion.setTheme({ accent: '#a78bfa' })
fusion.addWidget({
  title: 'Now Playing',
  html: '<b>Neon Drift</b> — 12h played',
})
fusion.notify('Sample plugin loaded')`
