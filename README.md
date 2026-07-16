# Jansen Workflows

React + TypeScript + Material UI app with multiple request workflows for submitting and reviewing requests. Built with Vite and React Router.

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
- Manager review page with approve/reject (rejection requires a comment)
- Excel-like staffing plan matrix (`/staffing-plan/matrix`) showing approved positions and authorized candidates with bi-weekly load

### PAF Requests (`/project-authorization`)
- PAF request form linked to approved staffing plan positions (cascading Functional Group → DSG → Position)
- Candidate details, roster, hours, and calendar date fields
- Manager review page with review status and approve/reject workflow

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — choose a workflow |
| `/onboarding` | Submit onboarding request |
| `/onboarding/manager` | Review onboarding requests |
| `/labour-change` | Submit labour change request |
| `/labour-change/manager` | Review labour change requests |
| `/staffing-plan` | New staffing plan position request |
| `/staffing-plan/manager` | Staffing plan manager review |
| `/staffing-plan/matrix` | Staffing plan matrix view |
| `/project-authorization` | New PAF request |
| `/project-authorization/manager` | PAF requests manager review |

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
