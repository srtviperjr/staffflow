import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { parseDateInput } from './staffingPlanDates'

export type PafDateRange = {
  startBiWeek: string
  lwp: string
}

export function isActivePafStatus(status: ProjectAuthorizationRequest['status']): boolean {
  return status === 'pending' || status === 'approved'
}

/** Inclusive date-range overlap on calendar days. */
export function dateRangesOverlap(a: PafDateRange, b: PafDateRange): boolean {
  const aStart = parseDateInput(a.startBiWeek)
  const aEnd = parseDateInput(a.lwp)
  const bStart = parseDateInput(b.startBiWeek)
  const bEnd = parseDateInput(b.lwp)
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime()
}

export function isDateOnOrAfter(value: string, minimum: string): boolean {
  const date = parseDateInput(value)
  const min = parseDateInput(minimum)
  if (!date || !min) return false
  return date.getTime() >= min.getTime()
}

export function isDateOnOrBefore(value: string, maximum: string): boolean {
  const date = parseDateInput(value)
  const max = parseDateInput(maximum)
  if (!date || !max) return false
  return date.getTime() <= max.getTime()
}

export function getAuthorizationsForPosition(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
): ProjectAuthorizationRequest[] {
  const staffingById = new Map(staffingRequests.map((request) => [request.id, request]))

  return authorizations.filter((request) => {
    if (!request.isCurrentRevision) return false
    if (request.staffingPlanRequestId === position.id) return true
    const linked = staffingById.get(request.staffingPlanRequestId)
    return linked?.revisionGroupId === position.revisionGroupId
  })
}

/** Active (pending/approved) current PAFs on a staffing position group. */
export function getActivePafsForPosition(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
  options?: { exceptRevisionGroupId?: string },
): ProjectAuthorizationRequest[] {
  return getAuthorizationsForPosition(position, authorizations, staffingRequests).filter(
    (request) => {
      if (!isActivePafStatus(request.status)) return false
      if (
        options?.exceptRevisionGroupId &&
        request.revisionGroupId === options.exceptRevisionGroupId
      ) {
        return false
      }
      return true
    },
  )
}

export function findOverlappingActivePaf(
  position: StaffingPlanRequest,
  range: PafDateRange,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
  options?: { exceptRevisionGroupId?: string },
): ProjectAuthorizationRequest | undefined {
  return getActivePafsForPosition(position, authorizations, staffingRequests, options).find(
    (request) =>
      dateRangesOverlap(range, {
        startBiWeek: request.startBiWeek,
        lwp: request.lwp,
      }),
  )
}

export type PafScheduleErrors = {
  startBiWeek?: string
  lwp?: string
  staffingPlanRequestId?: string
}

/** Enforce position window + non-overlapping active PAFs on the same position. */
export function validatePafSchedule(args: {
  range: PafDateRange
  position: StaffingPlanRequest
  authorizations: ProjectAuthorizationRequest[]
  staffingRequests: StaffingPlanRequest[]
  exceptRevisionGroupId?: string
}): PafScheduleErrors {
  const { range, position, authorizations, staffingRequests, exceptRevisionGroupId } = args
  const errors: PafScheduleErrors = {}

  const start = parseDateInput(range.startBiWeek)
  const end = parseDateInput(range.lwp)
  if (start && end && start.getTime() > end.getTime()) {
    errors.lwp = 'LWP must be on or after the PAF start bi-week'
  }

  if (range.startBiWeek && !isDateOnOrAfter(range.startBiWeek, position.startBiWeek)) {
    errors.startBiWeek = `Start cannot be earlier than the position available date (${position.startBiWeek})`
  }

  if (range.lwp && !isDateOnOrBefore(range.lwp, position.lwp)) {
    errors.lwp = errors.lwp ?? `LWP cannot be later than the position available end date (${position.lwp})`
  }

  if (range.startBiWeek && range.lwp && !errors.startBiWeek && !errors.lwp) {
    const overlap = findOverlappingActivePaf(
      position,
      range,
      authorizations,
      staffingRequests,
      { exceptRevisionGroupId },
    )
    if (overlap) {
      errors.lwp = `Dates overlap active PAF ${overlap.pafNumber} (${overlap.candidateName}: ${overlap.startBiWeek} – ${overlap.lwp})`
    }
  }

  return errors
}

/** Prefer the active PAF covering asOf, else the next upcoming, else latest by start. */
export function getDisplayAuthorizationForPosition(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
  asOf: Date = new Date(),
): ProjectAuthorizationRequest | undefined {
  const active = getActivePafsForPosition(position, authorizations, staffingRequests)
  if (active.length === 0) return undefined

  const asOfTime = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate()).getTime()

  const covering = active.find((request) => {
    const start = parseDateInput(request.startBiWeek)
    const end = parseDateInput(request.lwp)
    if (!start || !end) return false
    return start.getTime() <= asOfTime && asOfTime <= end.getTime()
  })
  if (covering) return covering

  const upcoming = active
    .filter((request) => {
      const start = parseDateInput(request.startBiWeek)
      return start && start.getTime() > asOfTime
    })
    .sort((a, b) => a.startBiWeek.localeCompare(b.startBiWeek))[0]
  if (upcoming) return upcoming

  return [...active].sort((a, b) => b.startBiWeek.localeCompare(a.startBiWeek))[0]
}

/**
 * True when another active PAF already occupies any part of the position window
 * (used to hide matrix "None" create when the full window is covered).
 */
export function positionWindowFullyCovered(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
): boolean {
  const active = getActivePafsForPosition(position, authorizations, staffingRequests)
  if (active.length === 0) return false
  return active.some((request) =>
    dateRangesOverlap(
      { startBiWeek: position.startBiWeek, lwp: position.lwp },
      { startBiWeek: request.startBiWeek, lwp: request.lwp },
    ),
  )
}
