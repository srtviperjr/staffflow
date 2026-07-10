# Staffing Plan Portal

A React application for submitting and reviewing staffing plan position requests. Built with Vite, TypeScript, Material UI, and React Router.

## Features

- **Position Request Form** — Capture phase, location, functional group, DSG, area, discipline, position, roster, hours, and schedule dates
- **Searchable dropdowns** — DSG, country (select or type), and position (search or type new)
- **Date validation** — Start bi-week must be a bi-weekly Sunday; LWP must be a weekly Sunday
- **Manager Review** — Approve or reject requests with required rejection comments and status filtering

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/staffing-plan` | Submit position request |
| `/staffing-plan/manager` | Review position requests |

## Data Storage

Position requests are persisted in `localStorage` under `staffing-plan-requests`.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build
