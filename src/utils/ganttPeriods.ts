import { parseDateInput } from './staffingPlanDates'

/** True when a bi-week period Sunday falls within [startBiWeek, lwp] inclusive. */
export function isPeriodInRange(period: string, startBiWeek: string, lwp: string): boolean {
  const current = parseDateInput(period)
  const start = parseDateInput(startBiWeek)
  const end = parseDateInput(lwp)
  if (!current || !start || !end) return false
  return current >= start && current <= end
}

export function ganttBarRole(
  period: string,
  periods: string[],
  startBiWeek: string,
  lwp: string,
): 'none' | 'single' | 'start' | 'middle' | 'end' {
  if (!isPeriodInRange(period, startBiWeek, lwp)) return 'none'

  const index = periods.indexOf(period)
  const prevIn =
    index > 0 ? isPeriodInRange(periods[index - 1], startBiWeek, lwp) : false
  const nextIn =
    index >= 0 && index < periods.length - 1
      ? isPeriodInRange(periods[index + 1], startBiWeek, lwp)
      : false

  if (!prevIn && !nextIn) return 'single'
  if (!prevIn && nextIn) return 'start'
  if (prevIn && !nextIn) return 'end'
  return 'middle'
}

export function statusBarColor(status: string): string {
  if (status === 'approved') return '#2e7d32'
  if (status === 'rejected') return '#c62828'
  return '#ed6c02'
}
