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

/** Distinct, readable bar colors keyed by person / assignment identity. */
const PERSON_BAR_PALETTE = [
  '#0d9488', // teal
  '#c2410c', // burnt orange
  '#1d4ed8', // blue
  '#b45309', // amber
  '#047857', // emerald
  '#be123c', // rose
  '#4338ca', // indigo
  '#a16207', // gold
  '#0f766e', // dark teal
  '#9a3412', // rust
  '#1e40af', // royal blue
  '#854d0e', // bronze
] as const

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

/** Stable highlight color for a person (or PAF group) across the calendar. */
export function personBarColor(seed: string): string {
  if (!seed) return PERSON_BAR_PALETTE[0]
  return PERSON_BAR_PALETTE[hashString(seed) % PERSON_BAR_PALETTE.length]
}

export function ganttBarRadius(
  role: ReturnType<typeof ganttBarRole>,
): number | string {
  if (role === 'single') return 6
  if (role === 'start') return '6px 0 0 6px'
  if (role === 'end') return '0 6px 6px 0'
  return 0
}
