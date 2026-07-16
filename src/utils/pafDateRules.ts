import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import {
  formatDateInput,
  isBiWeeklySunday,
  isSunday,
  parseDateInput,
} from './staffingPlanDates'

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
    errors.lwp = 'Last working day must be on or after the PAF start bi-week'
  }

  if (range.startBiWeek && !isDateOnOrAfter(range.startBiWeek, position.startBiWeek)) {
    errors.startBiWeek = `Start cannot be earlier than the position available date (${position.startBiWeek})`
  }

  if (range.lwp && !isDateOnOrBefore(range.lwp, position.lwp)) {
    errors.lwp =
      errors.lwp ??
      `Last working day cannot be later than the position available end date (${position.lwp})`
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
      errors.lwp = `Dates overlap ${overlap.candidateName}'s PAF ${overlap.pafNumber} (${overlap.startBiWeek} – ${overlap.lwp}). People on the same position cannot overlap.`
    }
  }

  return errors
}

function addDays(value: string, days: number): string | null {
  const date = parseDateInput(value)
  if (!date) return null
  date.setDate(date.getDate() + days)
  return formatDateInput(date)
}

function nextBiWeeklySundayOnOrAfter(value: string): string | null {
  const date = parseDateInput(value)
  if (!date) return null
  for (let step = 0; step < 28; step += 1) {
    if (isBiWeeklySunday(date)) return formatDateInput(date)
    date.setDate(date.getDate() + 1)
  }
  return null
}

function previousSundayOnOrBefore(value: string): string | null {
  const date = parseDateInput(value)
  if (!date) return null
  for (let step = 0; step < 14; step += 1) {
    if (isSunday(date)) return formatDateInput(date)
    date.setDate(date.getDate() - 1)
  }
  return null
}

function isRangeValid(range: PafDateRange): boolean {
  const start = parseDateInput(range.startBiWeek)
  const end = parseDateInput(range.lwp)
  return Boolean(start && end && start.getTime() <= end.getTime())
}

/**
 * First open date window on a position where another person can be assigned
 * without overlapping existing pending/approved PAFs.
 */
export function findNextAvailablePafRange(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
): PafDateRange | undefined {
  const occupied = getActivePafsForPosition(position, authorizations, staffingRequests)
    .slice()
    .sort((a, b) => a.startBiWeek.localeCompare(b.startBiWeek))

  let cursor = position.startBiWeek

  for (const request of occupied) {
    const dayBeforeStart = addDays(request.startBiWeek, -1)
    if (dayBeforeStart) {
      const gapStart = nextBiWeeklySundayOnOrAfter(cursor)
      const gapEnd = previousSundayOnOrBefore(dayBeforeStart)
      if (gapStart && gapEnd) {
        const range = { startBiWeek: gapStart, lwp: gapEnd }
        if (
          isRangeValid(range) &&
          isDateOnOrAfter(range.startBiWeek, position.startBiWeek) &&
          isDateOnOrBefore(range.lwp, position.lwp)
        ) {
          return range
        }
      }
    }

    const dayAfterEnd = addDays(request.lwp, 1)
    if (!dayAfterEnd) return undefined
    cursor = dayAfterEnd
  }

  const gapStart = nextBiWeeklySundayOnOrAfter(cursor)
  const gapEnd = previousSundayOnOrBefore(position.lwp)
  if (!gapStart || !gapEnd) return undefined

  const range = { startBiWeek: gapStart, lwp: gapEnd }
  if (
    !isRangeValid(range) ||
    !isDateOnOrAfter(range.startBiWeek, position.startBiWeek) ||
    !isDateOnOrBefore(range.lwp, position.lwp)
  ) {
    return undefined
  }
  return range
}

/** Prefer the person covering asOf, else the next upcoming assignment. */
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

  return active
    .filter((request) => {
      const start = parseDateInput(request.startBiWeek)
      return start && start.getTime() > asOfTime
    })
    .sort((a, b) => a.startBiWeek.localeCompare(b.startBiWeek))[0]
}

/** True when no remaining non-overlapping date window exists for another person. */
export function positionWindowFullyCovered(
  position: StaffingPlanRequest,
  authorizations: ProjectAuthorizationRequest[],
  staffingRequests: StaffingPlanRequest[],
): boolean {
  return !findNextAvailablePafRange(position, authorizations, staffingRequests)
}
