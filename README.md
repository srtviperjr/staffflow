# Jansen Workflows

React + TypeScript + Material UI app with multiple request workflows for submitting and reviewing requests. Built with Vite and React Router.

## Documentation

- [Requirements thus far](./docs/REQUIREMENTS.md) — product requirements implemented to date
- [Prompt history](./docs/PROMPTS.md) — user prompts used to build the app (Cursor Cloud sessions)

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

### Staffing Plan (`/staffing-plan`)
- Position request form with searchable dropdowns, date pickers, and validation
- Multi-step approval: Requestor → Cost Engineer → Manager → Project Director
- Excel-like staffing plan matrix (`/staffing-plan/matrix`) with revisions, related PAFs, and Gantt calendar

### PAF Requests (`/project-authorization`)
- PAF request form linked to approved staffing plan positions
- Approval: Requestor → Manager → Project Director (by project)
- PAF Register with revisions and Gantt visualization

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — available workflows + pending approvals |
| `/onboarding` | Submit onboarding request |
| `/onboarding/manager` | Review onboarding requests |
| `/labour-change` | Submit labour change request |
| `/labour-change/manager` | Review labour change requests |
| `/staffing-plan` | New staffing plan position request |
| `/staffing-plan/manager` | Staffing plan manager review |
| `/staffing-plan/matrix` | Staffing plan matrix view |
| `/project-authorization` | New PAF request |
| `/project-authorization/manager` | PAF requests manager review |
| `/project-authorization/register` | PAF register |

## Data Storage

Each workflow stores requests separately in `localStorage`:
- `onboarding-requests`
- `labour-change-requests`
- `staffing-plan-requests`
- `project-authorization-requests`

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and choose a workflow from the home page.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Lint with oxlint
