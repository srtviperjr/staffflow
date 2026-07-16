import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { formatDisplayDate, formatDisplayDateTime } from './staffingPlanDates'
import { personBarColor } from './ganttPeriods'

export type RelatedRegisterKind = 'staffing-plan' | 'project-authorization'

export interface RelatedRegisterItem {
  id: string
  kind: RelatedRegisterKind
  title: string
  subtitle: string
  status: 'pending' | 'approved' | 'rejected'
  revision: number
  submittedAt: string
  startBiWeek?: string
  lwp?: string
  startBiWeekRaw?: string
  lwpRaw?: string
  barColor?: string
  staffingRequest?: StaffingPlanRequest
  pafRequest?: ProjectAuthorizationRequest
}

export type StaffingPositionRelatedGroups = {
  positionRevisions: RelatedRegisterItem[]
  relatedPafs: RelatedRegisterItem[]
}

/** Neutral colour for staffing-position duration bars (not a person). */
export const POSITION_DURATION_BAR_COLOR = '#64748b'

function formatDatesCaption(startBiWeek?: string, lwp?: string, submittedAt?: string) {
  const parts: string[] = []
  if (startBiWeek) parts.push(`Start ${formatDisplayDate(startBiWeek)}`)
  if (lwp) parts.push(`Last working day ${formatDisplayDate(lwp)}`)
  if (submittedAt) parts.push(`Submitted ${formatDisplayDateTime(submittedAt)}`)
  return parts.join(' · ')
}

export function formatRelatedItemCaption(item: RelatedRegisterItem) {
  const dateCaption = formatDatesCaption(item.startBiWeekRaw, item.lwpRaw, item.submittedAt)
  return dateCaption ? `${item.subtitle} · ${dateCaption}` : item.subtitle
}

function toStaffingRevisionItem(request: StaffingPlanRequest): RelatedRegisterItem {
  return {
    id: request.id,
    kind: 'staffing-plan',
    title: request.position,
    subtitle: `Position ${request.positionNumber} · Rev ${request.revision}`,
    status: request.status,
    revision: request.revision,
    submittedAt: request.submittedAt,
    startBiWeek: formatDisplayDate(request.startBiWeek),
    lwp: formatDisplayDate(request.lwp),
    startBiWeekRaw: request.startBiWeek,
    lwpRaw: request.lwp,
    barColor: POSITION_DURATION_BAR_COLOR,
    staffingRequest: request,
  }
}

function toPafRelatedItem(request: ProjectAuthorizationRequest): RelatedRegisterItem {
  return {
    id: request.id,
    kind: 'project-authorization',
    title: request.candidateName,
    subtitle: `${request.pafNumber} · Rev ${request.revision}`,
    status: request.status,
    revision: request.revision,
    submittedAt: request.submittedAt,
    startBiWeek: formatDisplayDate(request.startBiWeek),
    lwp: formatDisplayDate(request.lwp),
    startBiWeekRaw: request.startBiWeek,
    lwpRaw: request.lwp,
    barColor: personBarColor(`${request.candidateName}:${request.revisionGroupId}`),
    pafRequest: request,
  }
}

/** Position revisions and related PAFs grouped separately (each with their own durations). */
export function getGroupedRelatedItemsForStaffingPosition(
  position: StaffingPlanRequest,
  allStaffing: StaffingPlanRequest[],
  allPaf: ProjectAuthorizationRequest[],
): StaffingPositionRelatedGroups {
  const positionRevisions = allStaffing
    .filter((request) => request.revisionGroupId === position.revisionGroupId)
    .map(toStaffingRevisionItem)
    .sort((a, b) => b.revision - a.revision)

  const staffingIdsInGroup = new Set(positionRevisions.map((item) => item.id))
  const relatedPafs = allPaf
    .filter((request) => {
      if (staffingIdsInGroup.has(request.staffingPlanRequestId)) return true
      const linked = allStaffing.find((item) => item.id === request.staffingPlanRequestId)
      return linked?.revisionGroupId === position.revisionGroupId
    })
    .map(toPafRelatedItem)
    .sort((a, b) => {
      const startCompare = (b.startBiWeekRaw ?? '').localeCompare(a.startBiWeekRaw ?? '')
      if (startCompare !== 0) return startCompare
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    })

  return { positionRevisions, relatedPafs }
}

/** Flat list helper (PAF register and older callers). */
export function getRelatedItemsForStaffingPosition(
  position: StaffingPlanRequest,
  allStaffing: StaffingPlanRequest[],
  allPaf: ProjectAuthorizationRequest[],
): RelatedRegisterItem[] {
  const grouped = getGroupedRelatedItemsForStaffingPosition(position, allStaffing, allPaf)
  return [...grouped.positionRevisions, ...grouped.relatedPafs]
}

/**
 * Other revisions for a PAF group (pending/rejected/older), shown under the
 * main approved register row. Excludes the main row itself.
 */
export function getRelatedItemsForPafRequest(
  request: ProjectAuthorizationRequest,
  allPaf: ProjectAuthorizationRequest[],
): RelatedRegisterItem[] {
  const statusRank = (status: RelatedRegisterItem['status']) =>
    status === 'pending' ? 0 : status === 'rejected' ? 1 : 2

  return allPaf
    .filter(
      (item) => item.revisionGroupId === request.revisionGroupId && item.id !== request.id,
    )
    .map(toPafRelatedItem)
    .sort((a, b) => {
      const byStatus = statusRank(a.status) - statusRank(b.status)
      if (byStatus !== 0) return byStatus
      return b.revision - a.revision
    })
}
