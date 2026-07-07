# Employee Onboarding Portal

A React application for submitting and managing new hire onboarding requests, built with Vite, TypeScript, Material UI, and React Router.

## Features

- **New Hire Request Form** — Requesting managers can submit onboarding requests with employee details, role, department, and start date.
- **Manager Review** — Managers can view all submitted requests, filter by status, and approve or reject pending requests.
- **Rejection Flow** — Rejecting a request requires an explanation.
- **Approval Flow** — Approving a request opens an onboarding details form (buddy info, machine setup, applications, and department-specific tools).
- **Confirmation** — A thank-you dialog appears after an approval form is submitted.

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

All application data is persisted in the browser's `sessionStorage`:

- **Submitted requests** — stored and available across page refreshes within the same browser tab/session
- **New hire request form draft** — in-progress form data is auto-saved as you type
- **Approval form drafts** — partially completed approval forms are saved per request
- **Manager filter tab** — the selected status filter is remembered during the session

Data is cleared when the browser tab is closed. Existing data from the previous `localStorage` implementation is automatically migrated on first load.
