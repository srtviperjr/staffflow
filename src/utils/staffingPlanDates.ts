const BIWEEKLY_REFERENCE = new Date(2025, 0, 5)

export type WeekPickerMode = 'weekly' | 'biweekly'

export function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSelectableWeekSunday(date: Date, mode: WeekPickerMode): boolean {
  if (!isSunday(date)) return false
  if (mode === 'weekly') return true
  return isBiWeeklySunday(date)
}

export function getWeeksForMonth(year: number, month: number): Date[][] {
  const weeks: Date[][] = []
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const cursor = new Date(year, month, 1)
  cursor.setDate(cursor.getDate() - cursor.getDay())

  while (cursor <= lastDayOfMonth || weeks.length === 0) {
    const week: Date[] = []
    for (let day = 0; day < 7; day += 1) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    if (week[0] > lastDayOfMonth) break
  }

  return weeks
}

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
  if (!date) return 'Last working day is required'
  if (!isSunday(date)) return 'Last working day must fall on a Sunday'
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

export function generateBiWeeklyPeriods(start: Date, count: number): string[] {
  const cursor = new Date(start)
  if (!isSunday(cursor)) {
    cursor.setDate(cursor.getDate() - cursor.getDay())
  }
  if (!isBiWeeklySunday(cursor)) {
    cursor.setDate(cursor.getDate() + 7)
  }

  const periods: string[] = []
  for (let index = 0; index < count; index += 1) {
    periods.push(formatDateInput(cursor))
    cursor.setDate(cursor.getDate() + 14)
  }
  return periods
}
