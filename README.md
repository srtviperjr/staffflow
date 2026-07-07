# Request Portal

A React application with two separate workflows for submitting and reviewing requests. Built with Vite, TypeScript, Material UI, and React Router.

## Workflows

### Employee Onboarding (`/onboarding`)
- New hire request form with role, department, and start date
- Manager review with approve/reject
- Approval opens an onboarding details form (buddy, machine setup, applications, department tools)
- Rejection requires an explanation

### Labour Change Request (`/labour-change`)
- Nine-field form for JS1/JS2 labour changes
- Manager review with approve/reject and review status display
- Rejection requires a comment

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and choose a workflow from the home page.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — choose a workflow |
| `/onboarding` | Submit onboarding request |
| `/onboarding/manager` | Review onboarding requests |
| `/labour-change` | Submit labour change request |
| `/labour-change/manager` | Review labour change requests |

## Data Storage

Each workflow stores requests separately in `localStorage`:
- `onboarding-requests`
- `labour-change-requests`

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build
