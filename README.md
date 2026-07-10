# Jansen StaffFlow

React + TypeScript + Material UI app for staffing plan position requests and project authorization requests with manager review workflows.

## Features

### Staffing Plan
- Position request form with searchable dropdowns, date pickers, and validation
- Manager review page with approve/reject (rejection requires a comment)

### Project Authorization
- Authorization request form linked to approved staffing plan positions (cascading Functional Group → DSG → Position)
- Candidate details, roster, hours, and calendar date fields
- Manager review page with review status and approve/reject workflow

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/staffing-plan` | New staffing plan position request |
| `/staffing-plan/manager` | Staffing plan manager review |
| `/project-authorization` | New project authorization request |
| `/project-authorization/manager` | Project authorization manager review |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
