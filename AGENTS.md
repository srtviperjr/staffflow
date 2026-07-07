# AGENTS.md

## Cursor Cloud specific instructions

This is a frontend-only React + TypeScript + Vite single-page app (the "Employee Onboarding Portal"). There is no backend, database, or environment variables; all state is persisted in the browser's `localStorage`.

- Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and are documented in `README.md`.
- Dependencies are refreshed automatically by the startup update script (`npm install`), so no manual install is needed.
- Run the app in development with `npm run dev` (Vite dev server on `http://localhost:5173`).
- `npm run lint` uses oxlint. It currently reports one pre-existing non-blocking warning in `src/context/RequestContext.tsx` (react fast-refresh only-export-components); this is expected and does not fail the command.
- `npm run build` runs `tsc -b && vite build` and prints a non-blocking "chunk larger than 500 kB" warning; this is expected.
- Since data lives only in `localStorage`, submitted onboarding requests persist per-browser-profile across refreshes but are not shared across machines. Clear site data to reset app state during testing.
