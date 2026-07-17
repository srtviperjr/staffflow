# Jansen Workflows — Requirements Document

**Product:** Jansen Workflows  
**Repository:** [srtviperjr/staffflow](https://github.com/srtviperjr/staffflow)  
**Status:** Frontend prototype (React + TypeScript + Vite + MUI)  
**As of:** 17 Jul 2026 (`main` @ PR #22)  
**Related:** [Prompt history](./PROMPTS.md)

This document captures product requirements implemented thus far, derived from user prompts and delivered behavior. It is a living snapshot, not a formal change-control baseline.

---

## 1. Purpose

Jansen Workflows is a **frontend-only** request and approval application for project staffing and personnel authorization (PAF) on Jansen projects (JS1 / JS2). Users submit position and PAF requests, route them through role-based approval workflows, and manage visibility by company.

There is **no backend**. All data persists in browser `localStorage`. Demo data is seeded and regenerable via **Load Sample Data**.

---

## 2. Goals

1. Model **Staffing Plan positions** and **PAF requests** with revisions.
2. Drive approvals with a configurable **workflow engine** (flowchart + roles + field decisions).
3. Support multi-company visibility and project-scoped Project Directors.
4. Provide Excel-like **matrix / register** views with Gantt-style duration bars.
5. Enable demo/testing via **Acting as**, roles/users admin, and sample data generation.

---

## 3. Users, companies, and roles

### 3.1 Companies

| Company | Visibility | Default phase |
|---------|------------|---------------|
| **BHP** | Sees all companies’ requests | — |
| **Hatch** | Own company only | JS1 |
| **Bantrel** | Own company only | JS1 |
| **Fluor** | Own company only | JS2 |

### 3.2 Roles

| Role | Responsibilities |
|------|------------------|
| **Admin** | Application Admin (Roles, Users, Workflows); Load Sample Data; full visibility bypass where applicable |
| **Requestor** | Submit / revise staffing and PAF requests |
| **Cost Engineer** | First approver on staffing; enters/sees **Hourly Cost** and derived **Total Cost** |
| **Manager** | Approves staffing (after Cost Engineer) and PAF (after submit) |
| **Project Director** | Final approver; **BHP**, **one user per project** (JS1 or JS2); sees cost; scoped to their project |
| **Viewer** | Read-oriented access (as assigned) |

### 3.3 Acting as

- Header control to switch the current demo user.
- Shows roles and **project (JS1/JS2)** when applicable.
- Label sits left of the dropdown (not clipped).
- Selection persists in `localStorage`.

---

## 4. Navigation & home

### 4.1 Header menus

- **Home**
- **Staff Management** — Position Request, Position Requests Review, Staffing Plan
- **PAF Management** — PAF Request, PAF Requests Review, PAF Register
- **Application Admin** (Admin only) — Roles, Users, Workflows

### 4.2 Home page

- **Top:** workflow / new-request entry points available to the current user’s roles.
- **Bottom:** **pending approvals** for the current user only (items waiting on their role now; not already completed by their role).
- Roles / Users / Workflows are **not** on Home for non-admins.

---

## 5. Staffing Plan

### 5.1 Position request

- Form fields include phase, location type, functional group, DSG, area/sub-area, country, discipline, position, class, company, roster, EE Id/SAP, sort number, total hours, hours to go, dates (start bi-week, last working day), and (for Cost Engineer visibility) hourly cost.
- **Position number:** `JS1-###` / `JS2-###`, incrementing per project phase (not company-prefixed).
- **Company** replaces former “Hiring Source”.
- Submissions open in a **closable dialog** (not a dead-end page requiring Back).

### 5.2 Revisions

- Changes to position particulars/duration are done via **Staffing Plan Position revision**.
- Main matrix row = **latest approved** revision per group; if the only revision is first and still pending, it may appear as pending.
- Rejected-only first revisions are **hidden** from main rows; later rejected revisions appear under expand.
- Expand (`+`) only when there is more than one position revision **or** related PAF revisions.
- Expand groups: **Position revisions** and **Related PAFs** separately.
- Pending updates indicated by icon beside `+`.

### 5.3 Approval workflow (staffing)

Overall status remains **Pending** until the final step completes.

1. **Submitted — by Requestor**
2. **Approved — by Cost Engineer** (costing approved; hourly cost required)
3. **Approved — by Manager**
4. **Approved — by Project Director** (project-scoped JS1/JS2) → **Fully Approved**

- Reject at any wait step ends the workflow as rejected.
- UI shows a horizontal progress checklist and a bottom **Workflow approvals** trail (who / when).
- Pending queues only include items the user can act on now.

### 5.4 Cost

- **Hourly Cost** visible/editable primarily for Cost Engineer (and Project Director / Admin as permitted).
- **Total Cost** = Hours To Go × Hourly Cost; display with `$`.
- Revisions that change cost show **delta** (e.g. `Δ +$17`).
- Hours changes show **hours delta** (e.g. `Δ +300`) on Total Hours and Hours To Go.
- Changed fields highlighted vs previous revision (approval review **and** Staffing Plan View dialog).

### 5.5 Staffing Plan matrix

- Metadata columns + Gantt calendar (position and person duration bars).
- Multi-select column filters; sticky headers + filter row.
- User-configurable sticky / visible / order of metadata columns (date columns fixed).
- Defaults: Position #, Candidate, Status sticky as configured.
- Actions on the left: View (icon), Revise (icon), Approve/Reject when actionable, Expand.
- Dates display as **D-MMM-YYYY** style (e.g. `3-Jun-2026`).
- Person bars use per-person highlight colors on the calendar.
- No Site-Comm / Site-Const / Office summary rollup rows.

---

## 6. PAF (Project Authorization Form)

### 6.1 Request

- Linked to an **approved** staffing plan position (cascading Functional Group → DSG → Position).
- Candidate details, company, roster, hours, start bi-week, **last working day**.
- Prefill from staffing plan when starting from an unassigned candidate slot.
- Forms open in closable dialogs.
- Naming: **PAF Request** (not “PAF Approval”).

### 6.2 Numbering & identity

- **PAF number:** sequential `PAF#####` (e.g. `PAF00001`).
- One PAF number = **one person** forever; revisions change details/duration/position, not the person.
- Legacy non-canonical numbers migrate to `PAF#####` on load.

### 6.3 Scheduling rules

- A staffing position may have **multiple people over time**, but active PAFs **must not overlap** on the same position.
- PAF start ≥ position available start; last working day within position window; no overlap with other active PAFs on that position.
- Enforced in validation and sample data generation.

### 6.4 Revisions & register

- Main PAF Register row = **latest approved** per PAF group; pending-only first revisions may appear; rejected-only first revisions hidden.
- Expand for additional revisions; pending icon when updates exist below.
- Same sticky/filter/actions patterns as staffing (PAF # + Candidate sticky by default; Status sticky).
- Gantt calendar visualizes each PAF’s duration (no numeric load cells required).

### 6.5 Approval workflow (PAF)

Same history/checklist/trail UX as staffing, with this path:

1. **Submitted — by Requestor**
2. **Approved — by Manager**
3. **Approved — by Project Director** (for linked position’s project JS1/JS2) → **Fully Approved**

- Status stays **Pending** until PD final approval.
- Reject ends the workflow.
- PD actions scoped by PAF `phase` from the linked staffing position.

---

## 7. Workflow engine & editor

### 7.1 Editor (Application Admin)

- Visual flowchart (React Flow): Start, Step, Decision, End.
- Steps assign **role** and **state**.
- Decisions: manual Yes/No or **field conditions** (including “field changed” style decisions).
- Workflows bind to form type (`staffing-plan` or `project-authorization`).
- Persist definitions in `localStorage`.

### 7.2 Runtime

- Submit starts the bound workflow; field gates auto-branch; wait steps pause for the assigned role.
- Approve/reject advances the graph; records actor name/time/action on history.
- Manager/review UIs show current step, checklist, and trail.

---

## 8. Sample data

- Admin **Load Sample Data** dialog:
  - Clear existing vs append.
  - Record counts; spread across companies and staffing vs PAF mix.
  - Hourly cost range slider for generated positions.
  - Progress feedback while clearing/generating (not “stuck”).
- Generated data must obey product rules (non-overlapping PAFs, one person per PAF #, valid workflows, etc.).
- Seed version bumps force refresh when schema/workflow shapes change.

---

## 9. Non-functional / technical

| Topic | Requirement |
|-------|-------------|
| Stack | React, TypeScript, Vite, MUI, React Router |
| Persistence | Browser `localStorage` only |
| Backend | None |
| Multi-tenant | Company visibility rules (client-side) |
| Demo | Acting as + roles/users + sample data |
| Quality bar | Lint (`oxlint`) and production build (`tsc` + Vite) on changes |

---

## 10. Explicitly out of scope (thus far)

- Real authentication / server API / database
- Production deployment hardening
- Full parity of Onboarding / Labour Change workflows with staffing/PAF depth (those routes remain lighter legacy flows)
- Email/notifications, audit export, or enterprise IAM

---

## 11. Traceability (major deliveries)

| Area | PRs (selected) |
|------|----------------|
| PAF from staffing + sample data | #1, #2 |
| Roles / users / acting as / nav | #3, #6, #7, #8 |
| Workflow editor + form runtime | #5, #9 |
| Company + Jansen rename | #10 |
| Home roles + company + revise | #11 |
| Matrix expand + PAF Register + Gantt + sample rules | #12 |
| Sticky/filters/expand gating | #13 |
| Matrix cleanup / rejected rows / JS# positions | #14–#16 |
| Cost, CE/PD, staffing approval UX | #17–#19 |
| View icon + sample progress | #20 |
| PAF Manager → PD workflow | #21 |
| Hours delta + view highlights | #22 |

Full prompt → feature mapping lives in [PROMPTS.md](./PROMPTS.md).
