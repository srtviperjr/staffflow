import type { AppRole } from '../types/roles'

export const ROLE_ADMIN = 'role-admin'
export const ROLE_MANAGER = 'role-manager'
export const ROLE_REQUESTOR = 'role-requestor'
export const ROLE_VIEWER = 'role-viewer'
export const ROLE_COST_ENGINEER = 'role-cost-engineer'
export const ROLE_PROJECT_DIRECTOR = 'role-project-director'

export function hasRole(roles: AppRole[], roleId: string): boolean {
  return roles.some((role) => role.id === roleId)
}

export function isAdmin(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_ADMIN)
}

export function isManager(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_MANAGER) || isAdmin(roles)
}

export function isCostEngineer(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_COST_ENGINEER) || isAdmin(roles)
}

export function isProjectDirector(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_PROJECT_DIRECTOR) || isAdmin(roles)
}

/** Hourly / total cost fields — Cost Engineers edit; Project Directors may view. */
export function canViewCostInfo(roles: AppRole[]): boolean {
  return (
    hasRole(roles, ROLE_COST_ENGINEER) ||
    hasRole(roles, ROLE_PROJECT_DIRECTOR) ||
    isAdmin(roles)
  )
}

export function canEditHourlyCost(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_COST_ENGINEER) || isAdmin(roles)
}

export function canSubmitRequests(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_REQUESTOR) || isManager(roles) || isAdmin(roles)
}

export function canReviewRequests(roles: AppRole[]): boolean {
  return (
    isManager(roles) ||
    hasRole(roles, ROLE_COST_ENGINEER) ||
    hasRole(roles, ROLE_PROJECT_DIRECTOR) ||
    isAdmin(roles)
  )
}

export function canViewStaffingMatrix(roles: AppRole[]): boolean {
  return (
    hasRole(roles, ROLE_VIEWER) ||
    hasRole(roles, ROLE_REQUESTOR) ||
    hasRole(roles, ROLE_COST_ENGINEER) ||
    hasRole(roles, ROLE_PROJECT_DIRECTOR) ||
    isManager(roles) ||
    isAdmin(roles)
  )
}

export function roleIdsOf(roles: AppRole[]): string[] {
  return roles.map((role) => role.id)
}
