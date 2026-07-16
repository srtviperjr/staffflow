/** Compute position cost from hours-to-go × hourly rate. */

export function parseCostNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const value = Number(trimmed.replace(/,/g, ''))
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
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatCostDelta(current: number | null, previous: number | null): string {
  if (current == null || previous == null) return ''
  const delta = current - previous
  if (delta === 0) return 'Δ 0'
  const sign = delta > 0 ? '+' : '−'
  return `Δ ${sign}${formatCostAmount(Math.abs(delta))}`
}

export function formatCostWithDelta(
  currentRaw: string,
  previousRaw: string | undefined,
): { display: string; delta?: string } {
  const current = parseCostNumber(currentRaw)
  const previous = previousRaw != null ? parseCostNumber(previousRaw) : null
  const display = formatCostAmount(current) || currentRaw || '—'
  if (previous == null || current == null) return { display }
  const delta = formatCostDelta(current, previous)
  return delta ? { display, delta } : { display }
}
