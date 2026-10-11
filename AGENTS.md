# Fusion Console — Base44 dev notes

## Run
- `docker compose -f docker-compose.base44.yml up -d` — web (Vite 6 + React) on host port 3000, API (Node 22 + Express) internal on 8000, reached via the Vite `/api` proxy (single-origin wiring).
- Dependencies install at container startup from `frontend/package.json` / `backend/package.json` (no lockfiles in repo; `npm install` is used).
- Healthchecks: web probes `/`, api probes `/api/health` (both via node's global fetch).

## Verify
- `curl localhost:3000/` serves the React app.
- `curl "localhost:3000/api/store?term=games"` returns Apple App Store (iTunes Search API) listings.
- `curl "localhost:3000/api/tscn?d=eyJ0aWxlcyI6W119"` downloads a `.tscn`.

## Notes / quirks
- Store data comes from the **public iTunes Search API** (no credentials, no payments), fetched **server-side** in the api service and cached 5 min. Browsers can't call it directly (no CORS on Apple's endpoint).
- EXE icon extraction: custom PE resource parser in `backend/pe-icon.js` (RT_GROUP_ICON/RT_ICON, BMP→PNG conversion using node zlib). No native deps. If no icon is found, the frontend generates a lettered fallback icon.
- EXE uploads are transient (multer memory storage) — nothing is persisted server-side; only the extracted icon data URL goes back to the browser.
- Plugins are plain JS files run in a sandboxed Web Worker with a tiny `fusion` API (`addWidget`/`setTheme`/`notify`); code and console state persist in browser localStorage.
- Console state (wallpaper, tiles, plugins, accent) persists in localStorage; share/restore via `?scene=<base64url-json>` link; `.tscn` export served by `/api/tscn?d=<state>` (pairs with a `fusion_console.gd` script exposing `wallpaper`/`accent`).
- No external secrets are required to run.
- Sandbox overrides: none beyond the platform-managed `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env (Vite host allowlist) and `CHOKIDAR_USEPOLLING=true` for file watching on bind mounts. With those unset the app behaves identically.
