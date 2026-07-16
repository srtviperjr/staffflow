import type { AppRole, AppUser } from '../types/roles'
import type { Phase } from '../types/staffingPlan'
import { ROLE_PROJECT_DIRECTOR } from './permissions'

export function isProjectDirectorRole(roleId: string): boolean {
  return roleId === ROLE_PROJECT_DIRECTOR
}

export function userHasProjectDirectorRole(
  userId: string,
  roles: AppRole[],
  roleIds?: readonly string[],
): boolean {
  if (roleIds) return roleIds.includes(ROLE_PROJECT_DIRECTOR)
  return roles.some(
    (role) => role.id === ROLE_PROJECT_DIRECTOR && role.userIds.includes(userId),
  )
}

/**
 * Project Director is BHP-only and limited to one assigned user per project (JS1/JS2).
 */
export function validateProjectDirectorAssignment(options: {
  user: Pick<AppUser, 'id' | 'company' | 'project'>
  roleIds: readonly string[]
  users: AppUser[]
  roles: AppRole[]
}): string {
  const { user, roleIds, users, roles } = options
  if (!roleIds.includes(ROLE_PROJECT_DIRECTOR)) return ''

  if (user.company !== 'BHP') {
    return 'Project Director is a BHP-only role'
  }

  if (!user.project) {
    return 'Project Director requires a project assignment (JS1 or JS2)'
  }

  const pdRole = roles.find((role) => role.id === ROLE_PROJECT_DIRECTOR)
  const otherPdUserIds = (pdRole?.userIds ?? []).filter((id) => id !== user.id)
  const conflict = users.find(
    (candidate) =>
      otherPdUserIds.includes(candidate.id) && candidate.project === user.project,
  )
  if (conflict) {
    return `${conflict.name} is already the Project Director for ${user.project}`
  }

  return ''
}

export function validateProjectDirectorRoleMembers(options: {
  roleId: string
  userIds: readonly string[]
  users: AppUser[]
}): string {
  const { roleId, userIds, users } = options
  if (roleId !== ROLE_PROJECT_DIRECTOR) return ''

  const members = users.filter((user) => userIds.includes(user.id))
  for (const member of members) {
    if (member.company !== 'BHP') {
      return `${member.name} must be BHP to hold Project Director`
    }
    if (!member.project) {
      return `${member.name} needs a project assignment before becoming Project Director`
    }
  }

  const byProject = new Map<Phase, AppUser[]>()
  for (const member of members) {
    const project = member.project as Phase
    const list = byProject.get(project) ?? []
    list.push(member)
    byProject.set(project, list)
  }
  for (const [project, list] of byProject) {
    if (list.length > 1) {
      return `Only one Project Director is allowed per project (${project})`
    }
  }

  return ''
}
