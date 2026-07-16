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

/**
 * Keep sticky columns contiguous at the start of the order so freeze-left
 * works (non-sticky columns between sticky ones break the sticky block).
 */
export function groupStickyColumnsFirst<T extends string>(
  columnOrder: readonly T[],
  stickyColumnIds: readonly T[],
): T[] {
  const stickySet = new Set(stickyColumnIds)
  const stickyOrdered = columnOrder.filter((id) => stickySet.has(id))
  const rest = columnOrder.filter((id) => !stickySet.has(id))
  return [...stickyOrdered, ...rest]
}

/** Merge a stored order with defaults, then put `leadingIds` first. */
export function mergeColumnOrder<T extends string>(
  stored: readonly T[] | null | undefined,
  defaults: readonly T[],
  leadingIds: readonly T[] = [],
): T[] {
  if (!stored || !Array.isArray(stored)) {
    return [...defaults]
  }
  const known = new Set(defaults)
  const filtered = stored.filter((id) => known.has(id))
  for (const id of defaults) {
    if (filtered.includes(id)) continue
    const defaultIndex = defaults.indexOf(id)
    filtered.splice(Math.min(defaultIndex, filtered.length), 0, id)
  }
  if (leadingIds.length === 0) return filtered
  return groupStickyColumnsFirst(filtered, leadingIds)
}
