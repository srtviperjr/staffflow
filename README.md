# Employee Onboarding Portal

A React application for submitting and managing new hire onboarding requests. Built with Vite, TypeScript, Material UI, and React Router.

## Features

- **New Hire Request Form** — Submit onboarding requests with employee details, role, department, and start date
- **Manager Review** — View, approve, or reject submitted requests
- **Approval Flow** — Approving opens an onboarding details form (buddy, machine setup, applications, department tools)
- **Rejection Flow** — Rejecting requires an explanation

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
| `/onboarding` | Submit onboarding request |
| `/onboarding/manager` | Review onboarding requests |

## Data Storage

Onboarding requests are persisted in `localStorage` under `onboarding-requests`.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build
