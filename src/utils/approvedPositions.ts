import type { StaffingPlanRequest } from '../types/staffingPlan'
import { sortAlpha } from '../constants/staffingPlanOptions'
import { getCurrentStaffingPlanRequests } from './staffingPlanRevisions'

export function getApprovedStaffingRequests(requests: StaffingPlanRequest[]) {
  return getCurrentStaffingPlanRequests(requests).filter((request) => request.status === 'approved')
}

export function getApprovedFunctionalGroups(requests: StaffingPlanRequest[]) {
  return sortAlpha([
    ...new Set(getApprovedStaffingRequests(requests).map((request) => request.functionalGroup)),
  ])
}

export function getApprovedDsgOptions(
  requests: StaffingPlanRequest[],
  functionalGroup: string,
) {
  return sortAlpha([
    ...new Set(
      getApprovedStaffingRequests(requests)
        .filter((request) => request.functionalGroup === functionalGroup)
        .map((request) => request.dsg),
    ),
  ])
}

export function formatApprovedPositionLabel(request: StaffingPlanRequest) {
  return `${request.position} — ${request.area} / ${request.subArea}`
}

export function getApprovedPositionOptions(
  requests: StaffingPlanRequest[],
  functionalGroup: string,
  dsg: string,
) {
  return getApprovedStaffingRequests(requests)
    .filter((request) => request.functionalGroup === functionalGroup && request.dsg === dsg)
    .map((request) => ({
      value: request.id,
      label: formatApprovedPositionLabel(request),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}
