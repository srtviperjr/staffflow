import type { AppRole } from '../types/roles'

export const ROLE_ADMIN = 'role-admin'
export const ROLE_MANAGER = 'role-manager'
export const ROLE_REQUESTOR = 'role-requestor'
export const ROLE_VIEWER = 'role-viewer'

export function hasRole(roles: AppRole[], roleId: string): boolean {
  return roles.some((role) => role.id === roleId)
}

export function isAdmin(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_ADMIN)
}

export function isManager(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_MANAGER) || isAdmin(roles)
}

export function canSubmitRequests(roles: AppRole[]): boolean {
  return hasRole(roles, ROLE_REQUESTOR) || isManager(roles) || isAdmin(roles)
}

export function canReviewRequests(roles: AppRole[]): boolean {
  return isManager(roles)
}

export function canViewStaffingMatrix(roles: AppRole[]): boolean {
  return (
    hasRole(roles, ROLE_VIEWER) ||
    hasRole(roles, ROLE_REQUESTOR) ||
    isManager(roles) ||
    isAdmin(roles)
  )
}

export function roleIdsOf(roles: AppRole[]): string[] {
  return roles.map((role) => role.id)
}
