import { filterByCompanyVisibility, type Company } from '../constants/companies'
import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { AppRole } from '../types/roles'
import type { Phase, StaffingPlanRequest } from '../types/staffingPlan'
import type { WorkflowDefinition } from '../types/workflow'
import { isAdmin, ROLE_PROJECT_DIRECTOR, roleIdsOf } from './permissions'

export type PendingApprovalKind = 'staffing-plan' | 'project-authorization'

export interface PendingApprovalItem {
  id: string
  kind: PendingApprovalKind
  title: string
  subtitle: string
  company: string
  submittedAt: string
  workflowStepLabel?: string
  reviewPath: string
}

function currentNode(
  workflow: WorkflowDefinition | undefined,
  request: { workflow?: { currentNodeId: string; workflowId: string } },
) {
  if (!workflow || !request.workflow) return undefined
  return workflow.nodes.find((node) => node.id === request.workflow!.currentNodeId)
}

export function isWaitingForUserRole(
  node: WorkflowDefinition['nodes'][number] | undefined,
  userRoleIds: string[],
  adminBypass: boolean,
): boolean {
  if (!node) return false
  const data = node.data
  const waiting =
    (data.kind === 'step' && data.waitForAction) ||
    (data.kind === 'decision' && data.decisionMode === 'manual')
  if (!waiting) return false
  if (adminBypass) return true
  if (!data.roleId) return false
  return userRoleIds.includes(data.roleId)
}

/**
 * Project Directors only act on staffing requests for their assigned project (phase).
 */
function matchesProjectDirectorScope(
  node: WorkflowDefinition['nodes'][number] | undefined,
  requestPhase: Phase | undefined,
  userProject: Phase | null | undefined,
  adminBypass: boolean,
): boolean {
  if (!node || node.data.roleId !== ROLE_PROJECT_DIRECTOR) return true
  if (adminBypass) return true
  if (!userProject || !requestPhase) return false
  return userProject === requestPhase
}

/** True when the request is waiting on a step/decision owned by this user's roles. */
export function canActOnWorkflowRequest(
  request: {
    workflow?: { currentNodeId: string; workflowId: string }
    status: string
    phase?: Phase
  },
  roles: AppRole[],
  getWorkflow: (workflowId: string) => WorkflowDefinition | undefined,
  options?: {
    fallbackRoleId?: string
    userProject?: Phase | null
  },
): boolean {
  if (request.status !== 'pending') return false
  const userRoleIds = roleIdsOf(roles)
  const adminBypass = isAdmin(roles)
  const fallbackRoleId = options?.fallbackRoleId ?? 'role-manager'

  if (!request.workflow) {
    return adminBypass || userRoleIds.includes(fallbackRoleId)
  }

  const workflow = getWorkflow(request.workflow.workflowId)
  const node = currentNode(workflow, request)
  if (!isWaitingForUserRole(node, userRoleIds, adminBypass)) return false
  return matchesProjectDirectorScope(node, request.phase, options?.userProject, adminBypass)
}

export function isCostEngineerReviewStep(
  request: { workflow?: { currentNodeId: string; workflowId: string } },
  getWorkflow: (workflowId: string) => WorkflowDefinition | undefined,
): boolean {
  if (!request.workflow) return false
  const workflow = getWorkflow(request.workflow.workflowId)
  const node = currentNode(workflow, request)
  return node?.data.roleId === 'role-cost-engineer' && Boolean(node.data.waitForAction)
}

export function getPendingApprovalsForUser(options: {
  staffingRequests: StaffingPlanRequest[]
  pafRequests: ProjectAuthorizationRequest[]
  roles: AppRole[]
  company: Company | undefined | null
  userProject?: Phase | null
  getWorkflow: (workflowId: string) => WorkflowDefinition | undefined
}): PendingApprovalItem[] {
  const { staffingRequests, pafRequests, roles, company, userProject, getWorkflow } = options
  const userRoleIds = roleIdsOf(roles)
  const adminBypass = isAdmin(roles)

  const visibleStaffing = filterByCompanyVisibility(staffingRequests, company).filter(
    (request) => request.isCurrentRevision && request.status === 'pending',
  )
  const visiblePaf = filterByCompanyVisibility(pafRequests, company).filter(
    (request) => request.isCurrentRevision && request.status === 'pending',
  )

  const staffingItems: PendingApprovalItem[] = visibleStaffing
    .filter((request) =>
      canActOnWorkflowRequest(request, roles, getWorkflow, { userProject }),
    )
    .map((request) => {
      const workflow = request.workflow
        ? getWorkflow(request.workflow.workflowId)
        : undefined
      const node = currentNode(workflow, request)
      return {
        id: request.id,
        kind: 'staffing-plan' as const,
        title: request.position,
        subtitle: `Position ${request.positionNumber} · ${request.phase} · ${request.area}`,
        company: request.company,
        submittedAt: request.submittedAt,
        workflowStepLabel: node?.data.label,
        reviewPath: '/staffing-plan/manager',
      }
    })

  const pafItems: PendingApprovalItem[] = visiblePaf
    .filter((request) => {
      const workflow = request.workflow
        ? getWorkflow(request.workflow.workflowId)
        : undefined
      const node = currentNode(workflow, request)
      if (!request.workflow) {
        return adminBypass || userRoleIds.includes('role-manager')
      }
      return isWaitingForUserRole(node, userRoleIds, adminBypass)
    })
    .map((request) => {
      const workflow = request.workflow
        ? getWorkflow(request.workflow.workflowId)
        : undefined
      const node = currentNode(workflow, request)
      return {
        id: request.id,
        kind: 'project-authorization' as const,
        title: request.candidateName,
        subtitle: `${request.pafNumber} · ${request.position}`,
        company: request.company,
        submittedAt: request.submittedAt,
        workflowStepLabel: node?.data.label,
        reviewPath: '/project-authorization/manager',
      }
    })

  return [...staffingItems, ...pafItems].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
}
