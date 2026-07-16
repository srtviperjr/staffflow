import type { Company } from '../constants/companies'
import type { StaffingPlanRequest } from '../types/staffingPlan'

/** Canonical position number: Company-### (e.g. Hatch-001, Fluor-012). */
export const POSITION_NUMBER_PATTERN = /^([A-Za-z][A-Za-z0-9]*)-(\d{3})$/

export function isValidPositionNumber(value: string | undefined | null): boolean {
  return Boolean(value && POSITION_NUMBER_PATTERN.test(value))
}

export function formatPositionNumber(company: string, sequence: number): string {
  return `${company}-${String(Math.max(0, Math.floor(sequence))).padStart(3, '0')}`
}

export function parsePositionNumber(
  value: string | undefined | null,
): { company: string; sequence: number } | null {
  if (!value) return null
  const match = POSITION_NUMBER_PATTERN.exec(value)
  if (!match) return null
  return { company: match[1], sequence: Number(match[2]) }
}

/** Highest ### used for a company among existing position numbers. */
export function maxPositionSequence(
  company: string,
  requests: Array<{ positionNumber?: string }> = [],
): number {
  let max = 0
  for (const request of requests) {
    const parsed = parsePositionNumber(request.positionNumber)
    if (parsed && parsed.company === company) {
      max = Math.max(max, parsed.sequence)
    }
  }
  return max
}

/** Next sequential position number for a company (Hatch-001, Hatch-002, …). */
export function nextPositionNumber(
  company: string,
  existing: Array<{ positionNumber?: string }> = [],
): string {
  return formatPositionNumber(company, maxPositionSequence(company, existing) + 1)
}

export function normalizeStaffingPlanRequest(request: StaffingPlanRequest): StaffingPlanRequest {
  return {
    ...request,
    revisionGroupId: request.revisionGroupId ?? request.id,
    revision: request.revision ?? 1,
    isCurrentRevision: request.isCurrentRevision ?? true,
    positionNumber: request.positionNumber ?? '',
  }
}

/**
 * Normalize revision metadata and repair non-canonical position numbers
 * (UUID fragments, HA001, etc.) to Company-###. Revisions in a group share one number.
 */
export function normalizeStaffingPlanRequests(
  requests: StaffingPlanRequest[],
): StaffingPlanRequest[] {
  const normalized = requests.map(normalizeStaffingPlanRequest)
  const numberByGroup = new Map<string, string>()
  const companyByGroup = new Map<string, Company | string>()

  for (const request of normalized) {
    if (!companyByGroup.has(request.revisionGroupId)) {
      companyByGroup.set(request.revisionGroupId, request.company)
    }
    if (
      isValidPositionNumber(request.positionNumber) &&
      !numberByGroup.has(request.revisionGroupId)
    ) {
      const parsed = parsePositionNumber(request.positionNumber)
      // Keep a valid number when its company prefix matches the position's company.
      if (parsed && parsed.company === request.company) {
        numberByGroup.set(request.revisionGroupId, request.positionNumber)
      }
    }
  }

  const nextByCompany = new Map<string, number>()
  const bumpNext = (company: string) => {
    if (!nextByCompany.has(company)) {
      nextByCompany.set(company, maxPositionSequence(company, normalized) + 1)
    }
  }

  // Reserve sequences already assigned to groups.
  for (const positionNumber of numberByGroup.values()) {
    const parsed = parsePositionNumber(positionNumber)
    if (!parsed) continue
    bumpNext(parsed.company)
    const current = nextByCompany.get(parsed.company) ?? 1
    if (parsed.sequence >= current) {
      nextByCompany.set(parsed.company, parsed.sequence + 1)
    }
  }

  for (const request of normalized) {
    if (numberByGroup.has(request.revisionGroupId)) continue
    const company = companyByGroup.get(request.revisionGroupId) ?? request.company
    bumpNext(company)
    const sequence = nextByCompany.get(company) ?? 1
    numberByGroup.set(request.revisionGroupId, formatPositionNumber(company, sequence))
    nextByCompany.set(company, sequence + 1)
  }

  const withCanonicalNumbers = normalized.map((request) => ({
    ...request,
    positionNumber:
      numberByGroup.get(request.revisionGroupId) ??
      nextPositionNumber(request.company, normalized),
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
