# AGENTS.md

## Cursor Cloud specific instructions

This is a frontend-only React + TypeScript + Vite single-page app. There is no backend, database, or environment variables.

- Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and are documented in `README.md`.
- Dependencies are refreshed automatically by the startup update script (`npm install`), so no manual install is needed.
- Run the app in development with `npm run dev` (Vite dev server on `http://localhost:5173`).
- `npm run lint` uses oxlint.
- `npm run build` runs `tsc -b && vite build` and may print a non-blocking "chunk larger than 500 kB" warning.
