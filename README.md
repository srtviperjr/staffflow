# Labour Change Request

A React application for submitting and reviewing labour change requests across projects JS1 and JS2. Built with Vite, TypeScript, Material UI, and React Router.

## Features

- **Labour Change Request Form** — Capture requester details, project, organization, role type, and reason for change
- **Review Requests Page** — Managers can view all submitted requests with review status (Pending, Approved, Rejected)
- **Approve / Reject** — Pending requests can be approved directly or rejected with a required comment
- **Status Filtering** — Filter the request list by All, Pending, Approved, or Rejected

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Data Storage

Requests are persisted in the browser's `localStorage`, so submissions remain available across page refreshes.
