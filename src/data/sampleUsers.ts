import type { AppRole, AppUser } from '../types/roles'

export const SAMPLE_USERS: AppUser[] = [
  {
    id: 'user-001',
    name: 'Alex Rivera',
    email: 'alex.rivera@bhp.com',
    title: 'Project Controls Lead',
    company: 'BHP',
  },
  {
    id: 'user-002',
    name: 'Jordan Lee',
    email: 'jordan.lee@bhp.com',
    title: 'Engineering Manager',
    company: 'BHP',
  },
  {
    id: 'user-003',
    name: 'Sam Patel',
    email: 'sam.patel@hatch.com',
    title: 'Staffing Coordinator',
    company: 'Hatch',
  },
  {
    id: 'user-004',
    name: 'Riley Quinn',
    email: 'riley.quinn@hatch.com',
    title: 'Engineering Manager',
    company: 'Hatch',
  },
  {
    id: 'user-005',
    name: 'Morgan Chen',
    email: 'morgan.chen@bantrel.com',
    title: 'Site Supervisor',
    company: 'Bantrel',
  },
  {
    id: 'user-006',
    name: 'Avery Kim',
    email: 'avery.kim@bantrel.com',
    title: 'Construction Manager',
    company: 'Bantrel',
  },
  {
    id: 'user-007',
    name: 'Casey Brooks',
    email: 'casey.brooks@fluor.com',
    title: 'HR Specialist',
    company: 'Fluor',
  },
  {
    id: 'user-008',
    name: 'Dana Ortiz',
    email: 'dana.ortiz@fluor.com',
    title: 'Project Services Lead',
    company: 'Fluor',
  },
  {
    id: 'user-009',
    name: 'Taylor Brooks',
    email: 'taylor.brooks@bhp.com',
    title: 'Senior Cost Engineer',
    company: 'BHP',
  },
  {
    id: 'user-010',
    name: 'Jamie Ng',
    email: 'jamie.ng@bhp.com',
    title: 'Cost Engineer',
    company: 'BHP',
  },
  {
    id: 'user-011',
    name: 'Drew Alvarez',
    email: 'drew.alvarez@bhp.com',
    title: 'Cost Engineer',
    company: 'BHP',
  },
  {
    id: 'user-012',
    name: 'Pat Okonkwo',
    email: 'pat.okonkwo@bhp.com',
    title: 'Project Director',
    company: 'BHP',
    project: 'JS1',
  },
  {
    id: 'user-013',
    name: 'Quinn Sato',
    email: 'quinn.sato@bhp.com',
    title: 'Project Director',
    company: 'BHP',
    project: 'JS2',
  },
]

export const DEFAULT_ROLES: AppRole[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full access to configuration and approvals',
    userIds: ['user-001'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Reviews and approves staffing and PAF requests',
    userIds: ['user-002', 'user-004', 'user-006', 'user-008'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-requestor',
    name: 'Requestor',
    description: 'Submits staffing plan and PAF requests',
    userIds: ['user-003', 'user-005', 'user-007'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access to staffing plan views',
    userIds: ['user-008'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-cost-engineer',
    name: 'Cost Engineer',
    description:
      'Performs Costing Approved on staffing position requests; enters hourly cost',
    userIds: ['user-009', 'user-010', 'user-011'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-project-director',
    name: 'Project Director',
    description:
      'BHP project lead (one per JS1/JS2 project) with visibility into position cost',
    userIds: ['user-012', 'user-013'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
]
