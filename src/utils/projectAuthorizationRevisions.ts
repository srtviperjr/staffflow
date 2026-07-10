import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'

export function generatePafNumber(uuid: string = crypto.randomUUID()): string {
  return uuid.split('-')[0].toUpperCase()
}

export function normalizeAuthorizationRequest(
  request: ProjectAuthorizationRequest,
): ProjectAuthorizationRequest {
  return {
    ...request,
    revisionGroupId: request.revisionGroupId ?? request.id,
    revision: request.revision ?? 1,
    isCurrentRevision: request.isCurrentRevision ?? true,
    pafNumber:
      request.pafNumber?.length === 8
        ? request.pafNumber
        : generatePafNumber(request.revisionGroupId ?? request.id),
  }
}

export function normalizeAuthorizationRequests(
  requests: ProjectAuthorizationRequest[],
): ProjectAuthorizationRequest[] {
  const normalized = requests.map(normalizeAuthorizationRequest)
  const latestByGroup = new Map<string, ProjectAuthorizationRequest>()

  for (const request of normalized) {
    const existing = latestByGroup.get(request.revisionGroupId)
    if (
      !existing ||
      request.revision > existing.revision ||
      (request.revision === existing.revision &&
        request.submittedAt > existing.submittedAt)
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

export function getCurrentAuthorizationRequests(requests: ProjectAuthorizationRequest[]) {
  return requests.filter((request) => request.isCurrentRevision)
}

export function getRevisionHistory(
  requests: ProjectAuthorizationRequest[],
  revisionGroupId: string,
) {
  return requests
    .filter((request) => request.revisionGroupId === revisionGroupId)
    .sort((a, b) => b.revision - a.revision)
}

export function getLatestApprovedAuthorizationByPosition(
  requests: ProjectAuthorizationRequest[],
) {
  const approved = requests.filter((request) => request.status === 'approved')
  const byPosition = new Map<string, ProjectAuthorizationRequest>()

  for (const request of approved) {
    const existing = byPosition.get(request.staffingPlanRequestId)
    if (!existing || request.revision > existing.revision) {
      byPosition.set(request.staffingPlanRequestId, request)
    }
  }

  return byPosition
}

export function requestToFormData(
  request: ProjectAuthorizationRequest,
): import('../types/projectAuthorization').ProjectAuthorizationFormData {
  return {
    staffingPlanRequestId: request.staffingPlanRequestId,
    functionalGroup: request.functionalGroup,
    dsg: request.dsg,
    candidateName: request.candidateName,
    country: request.country,
    class: request.class,
    hiringSource: request.hiringSource,
    eeIdSap: request.eeIdSap,
    sortNumber: request.sortNumber,
    totalHours: request.totalHours,
    roster: request.roster,
    startBiWeek: request.startBiWeek,
    lwp: request.lwp,
  }
}
