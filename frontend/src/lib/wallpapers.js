export const WALLPAPERS = [
  {
    id: 'violet',
    name: 'Violet Drift',
    css: 'radial-gradient(1200px 800px at 70% -10%, rgba(139,92,246,.38), transparent 60%), radial-gradient(900px 700px at 10% 110%, rgba(217,70,239,.22), transparent 60%), linear-gradient(160deg, #0a0c14 0%, #0d1020 45%, #090a12 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'radial-gradient(1000px 700px at 80% 10%, rgba(74,222,128,.20), transparent 60%), radial-gradient(900px 600px at 15% 90%, rgba(59,130,246,.28), transparent 60%), linear-gradient(180deg, #050810, #0a1220)',
  },
  {
    id: 'ember',
    name: 'Ember Dusk',
    css: 'radial-gradient(1100px 700px at 75% 20%, rgba(251,146,60,.28), transparent 60%), radial-gradient(800px 600px at 20% 100%, rgba(190,24,93,.22), transparent 60%), linear-gradient(200deg, #100a12, #1a0e10 60%, #0c0a10)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    css: 'radial-gradient(1000px 600px at 50% -20%, rgba(148,163,184,.16), transparent 60%), linear-gradient(180deg, #0b0d12, #12151c 55%, #0a0c10)',
  },
]

export function getWallpaper(id, custom) {
  if (custom) return { css: `url(${custom}) center / cover no-repeat` }
  return WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0]
}
