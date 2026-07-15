import type { AppRole, AppUser } from '../types/roles'

export const SAMPLE_USERS: AppUser[] = [
  {
    id: 'user-001',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    title: 'Project Controls Lead',
  },
  {
    id: 'user-002',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    title: 'Engineering Manager',
  },
  {
    id: 'user-003',
    name: 'Sam Patel',
    email: 'sam.patel@example.com',
    title: 'Staffing Coordinator',
  },
  {
    id: 'user-004',
    name: 'Morgan Chen',
    email: 'morgan.chen@example.com',
    title: 'Site Supervisor',
  },
  {
    id: 'user-005',
    name: 'Casey Brooks',
    email: 'casey.brooks@example.com',
    title: 'HR Specialist',
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
    userIds: ['user-002'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-requestor',
    name: 'Requestor',
    description: 'Submits staffing plan and PAF requests',
    userIds: ['user-003', 'user-004'],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access to staffing plan views',
    userIds: [],
    createdAt: '2026-06-01T09:00:00.000Z',
  },
]
