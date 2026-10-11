export default function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export const ICONS = {
  home: 'M3 11 12 3l9 8v10h-6v-6h-6v6H3z',
  store: 'M7 7h10l1.5 13h-13L7 7zM9 7a3 3 0 0 1 6 0',
  puzzle: 'M10 3h4v3a2 2 0 1 0 4 0h3v4h-3a2 2 0 1 0 0 4h3v4h-4v-3a2 2 0 1 0-4 0v3H7v-3a2 2 0 1 1 0-4H4v-4h3a2 2 0 1 1 3-4z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.5-4.5',
  play: 'M8 5l12 7-12 7z',
}
