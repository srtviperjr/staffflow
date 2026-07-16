import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'

export type RelatedRegisterKind = 'staffing-plan' | 'project-authorization'

export interface RelatedRegisterItem {
  id: string
  kind: RelatedRegisterKind
  title: string
  subtitle: string
  status: 'pending' | 'approved' | 'rejected'
  revision: number
  submittedAt: string
  staffingRequest?: StaffingPlanRequest
  pafRequest?: ProjectAuthorizationRequest
}

/** Staffing revisions + linked PAF requests for a position group, latest first. */
export function getRelatedItemsForStaffingPosition(
  position: StaffingPlanRequest,
  allStaffing: StaffingPlanRequest[],
  allPaf: ProjectAuthorizationRequest[],
): RelatedRegisterItem[] {
  const staffingRevisions = allStaffing
    .filter((request) => request.revisionGroupId === position.revisionGroupId)
    .map(
      (request): RelatedRegisterItem => ({
        id: request.id,
        kind: 'staffing-plan',
        title: request.position,
        subtitle: `Position ${request.positionNumber} · Rev ${request.revision}`,
        status: request.status,
        revision: request.revision,
        submittedAt: request.submittedAt,
        staffingRequest: request,
      }),
    )

  const staffingIdsInGroup = new Set(staffingRevisions.map((item) => item.id))
  const relatedPafs = allPaf
    .filter((request) => {
      if (staffingIdsInGroup.has(request.staffingPlanRequestId)) return true
      const linked = allStaffing.find((item) => item.id === request.staffingPlanRequestId)
      return linked?.revisionGroupId === position.revisionGroupId
    })
    .map(
      (request): RelatedRegisterItem => ({
        id: request.id,
        kind: 'project-authorization',
        title: request.candidateName,
        subtitle: `PAF ${request.pafNumber} · Rev ${request.revision}`,
        status: request.status,
        revision: request.revision,
        submittedAt: request.submittedAt,
        pafRequest: request,
      }),
    )

  return [...staffingRevisions, ...relatedPafs].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
}

/** All revisions for a PAF revision group, latest first. */
export function getRelatedItemsForPafRequest(
  request: ProjectAuthorizationRequest,
  allPaf: ProjectAuthorizationRequest[],
): RelatedRegisterItem[] {
  return allPaf
    .filter((item) => item.revisionGroupId === request.revisionGroupId)
    .map(
      (item): RelatedRegisterItem => ({
        id: item.id,
        kind: 'project-authorization',
        title: item.candidateName,
        subtitle: `PAF ${item.pafNumber} · Rev ${item.revision}`,
        status: item.status,
        revision: item.revision,
        submittedAt: item.submittedAt,
        pafRequest: item,
      }),
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
}
