import type { StaffingPlanRequest } from '../types/staffingPlan'

export function generatePositionNumber(uuid: string = crypto.randomUUID()): string {
  return uuid.split('-')[0].toUpperCase()
}

export function normalizeStaffingPlanRequest(request: StaffingPlanRequest): StaffingPlanRequest {
  return {
    ...request,
    revisionGroupId: request.revisionGroupId ?? request.id,
    revision: request.revision ?? 1,
    isCurrentRevision: request.isCurrentRevision ?? true,
    positionNumber:
      request.positionNumber?.length === 8
        ? request.positionNumber
        : generatePositionNumber(request.revisionGroupId ?? request.id),
  }
}

export function normalizeStaffingPlanRequests(
  requests: StaffingPlanRequest[],
): StaffingPlanRequest[] {
  const normalized = requests.map(normalizeStaffingPlanRequest)
  const latestByGroup = new Map<string, StaffingPlanRequest>()

  for (const request of normalized) {
    const existing = latestByGroup.get(request.revisionGroupId)
    if (
      !existing ||
      request.revision > existing.revision ||
      (request.revision === existing.revision && request.submittedAt > existing.submittedAt)
    ) {
      latestByGroup.set(request.revisionGroupId, request)
    }
  }

  const latestIds = new Set([...latestByGroup.values()].map((request) => request.id))

  return normalized.map((request) => ({
    ...request,
    isCurrentRevision: latestIds.has(request.id),
  }))
}

export function getCurrentStaffingPlanRequests(requests: StaffingPlanRequest[]) {
  return requests.filter((request) => request.isCurrentRevision)
}

export function getStaffingRevisionHistory(
  requests: StaffingPlanRequest[],
  revisionGroupId: string,
) {
  return requests
    .filter((request) => request.revisionGroupId === revisionGroupId)
    .sort((a, b) => b.revision - a.revision)
}

export function requestToStaffingFormData(
  request: StaffingPlanRequest,
): import('../types/staffingPlan').StaffingPlanFormData {
  return {
    phase: request.phase,
    locationType: request.locationType,
    functionalGroup: request.functionalGroup,
    dsg: request.dsg,
    area: request.area,
    subArea: request.subArea,
    country: request.country,
    discipline: request.discipline,
    position: request.position,
    class: request.class,
    company: request.company,
    eeIdSap: request.eeIdSap,
    sortNumber: request.sortNumber,
    totalHours: request.totalHours,
    hoursToGo: request.hoursToGo,
    roster: request.roster,
    startBiWeek: request.startBiWeek,
    lwp: request.lwp,
  }
}

export function findAuthorizationForPosition(
  position: StaffingPlanRequest,
  staffingRequests: StaffingPlanRequest[],
  authorizations: import('../types/projectAuthorization').ProjectAuthorizationRequest[],
) {
  const approved = authorizations.filter((request) => request.status === 'approved')
  const direct = approved.find((request) => request.staffingPlanRequestId === position.id)
  if (direct) return direct

  return approved.find((request) => {
    const linkedPosition = staffingRequests.find(
      (staffingRequest) => staffingRequest.id === request.staffingPlanRequestId,
    )
    return linkedPosition?.revisionGroupId === position.revisionGroupId
  })
}
