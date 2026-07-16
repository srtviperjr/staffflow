import type { Company } from '../constants/companies'
import type { Phase } from './staffingPlan'

export interface AppUser {
  id: string
  name: string
  email: string
  title: string
  company: Company
  /**
   * Project assignment (JS1 / JS2). Required for Project Director —
   * only one Project Director user per project.
   */
  project?: Phase | null
}

export interface AppRole {
  id: string
  name: string
  description: string
  userIds: string[]
  createdAt: string
}

export interface CreateRoleInput {
  name: string
  description: string
}

export interface CreateUserInput {
  name: string
  email: string
  title: string
  company: Company
  project?: Phase | null
}
