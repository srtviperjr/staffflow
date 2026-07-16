import type { StaffingPlanRequest } from '../types/staffingPlan'
import { sortAlpha } from '../constants/staffingPlanOptions'

/**
 * Latest approved revision per position group.
 * A newer pending/rejected revision does not remove the position from the plan.
 */
export function getApprovedStaffingRequests(requests: StaffingPlanRequest[]) {
  const latestApprovedByGroup = new Map<string, StaffingPlanRequest>()

  for (const request of requests) {
    if (request.status !== 'approved') continue
    const existing = latestApprovedByGroup.get(request.revisionGroupId)
    if (
      !existing ||
      request.revision > existing.revision ||
      (request.revision === existing.revision && request.submittedAt > existing.submittedAt)
    ) {
      latestApprovedByGroup.set(request.revisionGroupId, request)
    }
  }

  return [...latestApprovedByGroup.values()]
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
