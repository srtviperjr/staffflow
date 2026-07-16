/** Shared sticky styles for freeze-left table panes. */

export const stickyEdgeShadow = '2px 0 6px rgba(0,0,0,0.12)'

/** Compact width for sticky expand-detail text while the calendar scrolls. */
export const STICKY_EXPAND_DETAIL_WIDTH = 420

export function columnWidth(minWidth: number | undefined, fallback = 110): number {
  return minWidth ?? fallback
}

export type StickyColumnLike = {
  id: string
  minWidth?: number
}

/**
 * Freeze Expand + Actions, then any user-selected sticky metadata columns
 * (in current visible order). Expand-detail sticks after that block.
 */
export function buildStickyColumnLayout(
  expandWidth: number,
  actionsWidth: number,
  visibleColumns: StickyColumnLike[],
  stickyColumnIds: readonly string[],
  fallback = 110,
) {
  const stickySet = new Set(stickyColumnIds)
  const stickyVisible = visibleColumns.filter((column) => stickySet.has(column.id))

  const offsets = new Map<string, number>()
  let left = expandWidth + actionsWidth
  for (const column of stickyVisible) {
    offsets.set(column.id, left)
    left += columnWidth(column.minWidth, fallback)
  }

  const lastStickyId = stickyVisible.length > 0 ? stickyVisible[stickyVisible.length - 1].id : null

  return {
    offsets,
    stickyVisibleIds: stickyVisible.map((column) => column.id),
    lastStickyId,
    isSticky: (columnId: string) => offsets.has(columnId),
    leftFor: (columnId: string) => offsets.get(columnId),
    /** Sticky left for expand-detail content (after Expand + Actions + sticky cols). */
    detailLeft: left,
    actionsHaveEdgeShadow: stickyVisible.length === 0,
  }
}

export function loadStickyColumnIds<T extends string>(
  storageKey: string,
  defaults: readonly T[],
  knownIds: readonly T[],
): T[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return [...defaults]
    const parsed = JSON.parse(stored) as T[]
    if (!Array.isArray(parsed)) return [...defaults]
    const known = new Set(knownIds)
    return parsed.filter((id) => known.has(id))
  } catch {
    return [...defaults]
  }
}
