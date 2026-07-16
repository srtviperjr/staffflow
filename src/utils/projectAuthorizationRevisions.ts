import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { findOverlappingActivePaf } from './pafDateRules'

/** Canonical PAF number format used by sample data and new submissions: PAF00001 */
export const PAF_NUMBER_PATTERN = /^PAF\d{5}$/

export function isValidPafNumber(value: string | undefined | null): boolean {
  return Boolean(value && PAF_NUMBER_PATTERN.test(value))
}

export function formatPafNumber(sequence: number): string {
  return `PAF${String(Math.max(0, Math.floor(sequence))).padStart(5, '0')}`
}

export function maxPafSequence(requests: Array<{ pafNumber?: string }>): number {
  let max = 0
  for (const request of requests) {
    const match = request.pafNumber ? /^PAF(\d{5})$/.exec(request.pafNumber) : null
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max
}

/** Next sequential PAF number (PAF#####) based on existing requests. */
export function nextPafNumber(existing: Array<{ pafNumber?: string }> = []): string {
  return formatPafNumber(maxPafSequence(existing) + 1)
}

/** @deprecated Prefer nextPafNumber(existingRequests). Kept for call-site clarity. */
export function generatePafNumber(existing: Array<{ pafNumber?: string }> = []): string {
  return nextPafNumber(existing)
}

export function normalizeAuthorizationRequest(
  request: ProjectAuthorizationRequest,
): ProjectAuthorizationRequest {
  return {
    ...request,
    revisionGroupId: request.revisionGroupId ?? request.id,
    revision: request.revision ?? 1,
    isCurrentRevision: request.isCurrentRevision ?? true,
    pafNumber: request.pafNumber ?? '',
  }
}

/**
 * Normalize revision metadata and repair non-canonical PAF numbers (e.g. UUID fragments
 * like 55B4EF40) to the PAF##### convention. All revisions in a group share one number.
 */
export function normalizeAuthorizationRequests(
  requests: ProjectAuthorizationRequest[],
): ProjectAuthorizationRequest[] {
  const normalized = requests.map(normalizeAuthorizationRequest)
  let nextSequence = maxPafSequence(normalized) + 1
  const pafByGroup = new Map<string, string>()

  for (const request of normalized) {
    if (isValidPafNumber(request.pafNumber) && !pafByGroup.has(request.revisionGroupId)) {
      pafByGroup.set(request.revisionGroupId, request.pafNumber)
    }
  }

  for (const request of normalized) {
    if (!pafByGroup.has(request.revisionGroupId)) {
      pafByGroup.set(request.revisionGroupId, formatPafNumber(nextSequence))
      nextSequence += 1
    }
  }

  const withCanonicalPaf = normalized.map((request) => ({
    ...request,
    pafNumber: pafByGroup.get(request.revisionGroupId) ?? request.pafNumber,
  }))

  const latestByGroup = new Map<string, ProjectAuthorizationRequest>()

  for (const request of withCanonicalPaf) {
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

  return withCanonicalPaf.map((request) => ({
    ...request,
    isCurrentRevision: latestIds.has(request.id),
  }))
}

export function authorizationPafNumbersChanged(
  before: ProjectAuthorizationRequest[],
  after: ProjectAuthorizationRequest[],
): boolean {
  if (before.length !== after.length) return true
  const beforeById = new Map(before.map((request) => [request.id, request.pafNumber]))
  return after.some((request) => beforeById.get(request.id) !== request.pafNumber)
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

export {
  isActivePafStatus,
  getDisplayAuthorizationForPosition as getActiveAuthorizationForPosition,
  getActivePafsForPosition,
  findOverlappingActivePaf,
  findNextAvailablePafRange,
  validatePafSchedule,
  positionWindowFullyCovered,
} from './pafDateRules'

/** True when another active PAF already covers the given (or full position) date window. */
export function positionHasActivePaf(
  positionId: string,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
  options?: { exceptRevisionGroupId?: string; range?: { startBiWeek: string; lwp: string } },
): ProjectAuthorizationRequest | undefined {
  const position = staffingRequests.find((request) => request.id === positionId)
  if (!position) return undefined

  return findOverlappingActivePaf(
    position,
    options?.range ?? {
      startBiWeek: position.startBiWeek,
      lwp: position.lwp,
    },
    authorizations,
    staffingRequests,
    { exceptRevisionGroupId: options?.exceptRevisionGroupId },
  )
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
    company: request.company,
    eeIdSap: request.eeIdSap,
    sortNumber: request.sortNumber,
    totalHours: request.totalHours,
    roster: request.roster,
    startBiWeek: request.startBiWeek,
    lwp: request.lwp,
  }
}

export function staffingPlanToFormData(
  position: StaffingPlanRequest,
): import('../types/projectAuthorization').ProjectAuthorizationFormData {
  return {
    staffingPlanRequestId: position.id,
    functionalGroup: position.functionalGroup,
    dsg: position.dsg,
    candidateName: '',
    country: position.country,
    class: position.class,
    company: position.company,
    eeIdSap: position.eeIdSap,
    sortNumber: position.sortNumber,
    totalHours: position.totalHours,
    roster: position.roster,
    startBiWeek: position.startBiWeek,
    lwp: position.lwp,
  }
}
