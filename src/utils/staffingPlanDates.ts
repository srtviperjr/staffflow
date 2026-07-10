const BIWEEKLY_REFERENCE = new Date(2025, 0, 5)

export function parseDateInput(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

export function isBiWeeklySunday(date: Date): boolean {
  if (!isSunday(date)) return false
  const diffDays = Math.round((date.getTime() - BIWEEKLY_REFERENCE.getTime()) / 86400000)
  return diffDays % 14 === 0
}

export function validateLwpDate(value: string): string | undefined {
  const date = parseDateInput(value)
  if (!date) return 'LWP date is required'
  if (!isSunday(date)) return 'LWP must fall on a Sunday'
  return undefined
}

export function validateBiWeekDate(value: string): string | undefined {
  const date = parseDateInput(value)
  if (!date) return 'Start bi-week date is required'
  if (!isBiWeeklySunday(date)) {
    return 'Start bi-week must be a Sunday on the bi-weekly schedule (every 2 weeks)'
  }
  return undefined
}

export function formatDisplayDate(value: string): string {
  const date = parseDateInput(value)
  if (!date) return value
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
