export function getPreviousRevision<
  T extends { revision: number; revisionGroupId: string },
>(history: T[], current: T): T | undefined {
  return history.find((entry) => entry.revision === current.revision - 1)
}

export function getChangedFieldKeys<T extends object>(
  current: T,
  previous: T | undefined,
  fields: readonly (keyof T)[],
): Set<string> {
  if (!previous) return new Set()

  const changed = new Set<string>()
  for (const field of fields) {
    const currentValue = normalizeCompareValue(current[field as keyof T])
    const previousValue = normalizeCompareValue(previous[field as keyof T])
    if (currentValue !== previousValue) {
      changed.add(String(field))
    }
  }
  return changed
}

function normalizeCompareValue(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

export const STAFFING_PLAN_COMPARE_FIELDS = [
  'phase',
  'locationType',
  'functionalGroup',
  'dsg',
  'area',
  'subArea',
  'country',
  'discipline',
  'position',
  'class',
  'hiringSource',
  'company',
  'eeIdSap',
  'sortNumber',
  'totalHours',
  'hoursToGo',
  'roster',
  'startBiWeek',
  'lwp',
] as const

export const PAF_APPROVAL_COMPARE_FIELDS = [
  'staffingPlanRequestId',
  'functionalGroup',
  'dsg',
  'position',
  'approvedPositionLabel',
  'candidateName',
  'country',
  'class',
  'hiringSource',
  'company',
  'eeIdSap',
  'sortNumber',
  'totalHours',
  'roster',
  'startBiWeek',
  'lwp',
] as const
