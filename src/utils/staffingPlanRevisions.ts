import type { Phase, StaffingPlanRequest } from '../types/staffingPlan'

/** Canonical position number: project prefix + sequence (JS1-001, JS2-012). */
export const POSITION_NUMBER_PATTERN = /^(JS[12])-(\d{3})$/

export type PositionNumberPrefix = 'JS1' | 'JS2'

export function isValidPositionNumber(value: string | undefined | null): boolean {
  return Boolean(value && POSITION_NUMBER_PATTERN.test(value))
}

export function formatPositionNumber(phase: string, sequence: number): string {
  const prefix = phase === 'JS2' ? 'JS2' : 'JS1'
  return `${prefix}-${String(Math.max(0, Math.floor(sequence))).padStart(3, '0')}`
}

export function parsePositionNumber(
  value: string | undefined | null,
): { phase: PositionNumberPrefix; sequence: number } | null {
  if (!value) return null
  const match = POSITION_NUMBER_PATTERN.exec(value)
  if (!match) return null
  return { phase: match[1] as PositionNumberPrefix, sequence: Number(match[2]) }
}

/** Highest ### used for a project prefix among existing position numbers. */
export function maxPositionSequence(
  phase: string,
  requests: Array<{ positionNumber?: string }> = [],
): number {
  const prefix = phase === 'JS2' ? 'JS2' : 'JS1'
  let max = 0
  for (const request of requests) {
    const parsed = parsePositionNumber(request.positionNumber)
    if (parsed && parsed.phase === prefix) {
      max = Math.max(max, parsed.sequence)
    }
  }
  return max
}

/** Next sequential position number for a project (JS1-001, JS1-002, …). */
export function nextPositionNumber(
  phase: string,
  existing: Array<{ positionNumber?: string }> = [],
): string {
  const prefix = phase === 'JS2' ? 'JS2' : 'JS1'
  return formatPositionNumber(prefix, maxPositionSequence(prefix, existing) + 1)
}

export function normalizeStaffingPlanRequest(request: StaffingPlanRequest): StaffingPlanRequest {
  return {
    ...request,
    revisionGroupId: request.revisionGroupId ?? request.id,
    revision: request.revision ?? 1,
    isCurrentRevision: request.isCurrentRevision ?? true,
    positionNumber: request.positionNumber ?? '',
    hourlyCost: request.hourlyCost ?? '',
  }
}

/**
 * Normalize revision metadata and repair non-canonical position numbers
 * (Company-###, UUID fragments, HA001, etc.) to JS1-### / JS2-###.
 * Revisions in a group share one number keyed by project phase.
 */
export function normalizeStaffingPlanRequests(
  requests: StaffingPlanRequest[],
): StaffingPlanRequest[] {
  const normalized = requests.map(normalizeStaffingPlanRequest)
  const numberByGroup = new Map<string, string>()
  const phaseByGroup = new Map<string, Phase>()

  for (const request of normalized) {
    if (!phaseByGroup.has(request.revisionGroupId)) {
      phaseByGroup.set(request.revisionGroupId, request.phase === 'JS2' ? 'JS2' : 'JS1')
    }
    if (
      isValidPositionNumber(request.positionNumber) &&
      !numberByGroup.has(request.revisionGroupId)
    ) {
      const parsed = parsePositionNumber(request.positionNumber)
      const phase = phaseByGroup.get(request.revisionGroupId) ?? 'JS1'
      // Keep a valid number when its project prefix matches the position's phase.
      if (parsed && parsed.phase === phase) {
        numberByGroup.set(request.revisionGroupId, request.positionNumber)
      }
    }
  }

  const nextByPhase = new Map<PositionNumberPrefix, number>()
  const bumpNext = (phase: PositionNumberPrefix) => {
    if (!nextByPhase.has(phase)) {
      nextByPhase.set(phase, maxPositionSequence(phase, normalized) + 1)
    }
  }

  // Reserve sequences already assigned to groups.
  for (const positionNumber of numberByGroup.values()) {
    const parsed = parsePositionNumber(positionNumber)
    if (!parsed) continue
    bumpNext(parsed.phase)
    const current = nextByPhase.get(parsed.phase) ?? 1
    if (parsed.sequence >= current) {
      nextByPhase.set(parsed.phase, parsed.sequence + 1)
    }
  }

  for (const request of normalized) {
    if (numberByGroup.has(request.revisionGroupId)) continue
    const phase = phaseByGroup.get(request.revisionGroupId) ?? 'JS1'
    bumpNext(phase)
    const sequence = nextByPhase.get(phase) ?? 1
    numberByGroup.set(request.revisionGroupId, formatPositionNumber(phase, sequence))
    nextByPhase.set(phase, sequence + 1)
  }

  const withCanonicalNumbers = normalized.map((request) => ({
    ...request,
    positionNumber:
      numberByGroup.get(request.revisionGroupId) ??
      nextPositionNumber(request.phase, normalized),
  }))

  const latestByGroup = new Map<string, StaffingPlanRequest>()

  for (const request of withCanonicalNumbers) {
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

  return withCanonicalNumbers.map((request) => ({
    ...request,
    isCurrentRevision: latestIds.has(request.id),
  }))
}

export function staffingPositionNumbersChanged(
  before: StaffingPlanRequest[],
  after: StaffingPlanRequest[],
): boolean {
  if (before.length !== after.length) return true
  const beforeById = new Map(before.map((request) => [request.id, request.positionNumber]))
  return after.some((request) => beforeById.get(request.id) !== request.positionNumber)
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
    hourlyCost: request.hourlyCost ?? '',
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
