import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { formatDisplayDate } from './staffingPlanDates'
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

function formatPersonDatesCaption(startBiWeek?: string, lwp?: string, submittedAt?: string) {
  const parts: string[] = []
  if (startBiWeek) parts.push(`Start ${formatDisplayDate(startBiWeek)}`)
  if (lwp) parts.push(`Last working day ${formatDisplayDate(lwp)}`)
  if (submittedAt) parts.push(`Submitted ${new Date(submittedAt).toLocaleString()}`)
  return parts.join(' · ')
}

export function formatRelatedItemCaption(item: RelatedRegisterItem) {
  const dateCaption = formatPersonDatesCaption(
    item.startBiWeekRaw,
    item.lwpRaw,
    item.submittedAt,
  )
  return dateCaption ? `${item.subtitle} · ${dateCaption}` : item.subtitle
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
        startBiWeek: formatDisplayDate(request.startBiWeek),
        lwp: formatDisplayDate(request.lwp),
        startBiWeekRaw: request.startBiWeek,
        lwpRaw: request.lwp,
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
        startBiWeek: formatDisplayDate(request.startBiWeek),
        lwp: formatDisplayDate(request.lwp),
        startBiWeekRaw: request.startBiWeek,
        lwpRaw: request.lwp,
        barColor: personBarColor(`${request.candidateName}:${request.revisionGroupId}`),
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
        startBiWeek: formatDisplayDate(item.startBiWeek),
        lwp: formatDisplayDate(item.lwp),
        startBiWeekRaw: item.startBiWeek,
        lwpRaw: item.lwp,
        barColor: personBarColor(`${item.candidateName}:${item.revisionGroupId}`),
        pafRequest: item,
      }),
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
}
