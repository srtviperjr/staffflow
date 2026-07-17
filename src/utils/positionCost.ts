/** Compute and format position/total cost from hours-to-go × hourly rate. */

export function parseCostNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null
  const trimmed = String(raw).trim().replace(/^\$/, '').replace(/,/g, '')
  if (!trimmed) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function computePositionCost(
  hoursToGo: string | undefined | null,
  hourlyCost: string | undefined | null,
): number | null {
  const hours = parseCostNumber(hoursToGo)
  const rate = parseCostNumber(hourlyCost)
  if (hours == null || rate == null) return null
  return hours * rate
}

export function formatCostAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ''
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/** Format a stored hourly-cost string for display with a $ prefix. */
export function formatHourlyCostDisplay(raw: string | undefined | null): string {
  const value = parseCostNumber(raw)
  if (value == null) return raw?.trim() ? String(raw).trim() : ''
  return formatCostAmount(value)
}

export function formatCostDelta(current: number | null, previous: number | null): string {
  if (current == null || previous == null) return ''
  const delta = current - previous
  if (delta === 0) return 'Δ $0'
  const sign = delta > 0 ? '+' : '−'
  const abs = Math.abs(delta).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `Δ ${sign}$${abs}`
}

/** Format an hours change between revisions, e.g. "Δ +300" / "Δ −40". */
export function formatHoursDelta(
  currentRaw: string | undefined | null,
  previousRaw: string | undefined | null,
): string {
  const current = parseCostNumber(currentRaw)
  const previous = parseCostNumber(previousRaw)
  if (current == null || previous == null) return ''
  const delta = current - previous
  if (delta === 0) return 'Δ 0'
  const sign = delta > 0 ? '+' : '−'
  const abs = Math.abs(delta).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `Δ ${sign}${abs}`
}

export function formatCostWithDelta(
  currentRaw: string,
  previousRaw: string | undefined,
): { display: string; delta?: string; previousDisplay?: string } {
  const current = parseCostNumber(currentRaw)
  const previous = previousRaw != null ? parseCostNumber(previousRaw) : null
  const display = formatHourlyCostDisplay(currentRaw) || '—'
  const previousDisplay =
    previousRaw != null && previousRaw !== ''
      ? formatHourlyCostDisplay(previousRaw) || previousRaw
      : undefined
  if (previous == null || current == null) return { display, previousDisplay }
  const delta = formatCostDelta(current, previous)
  return delta ? { display, delta, previousDisplay } : { display, previousDisplay }
}
