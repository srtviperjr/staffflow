/** Helpers for freezing expand + actions + metadata while the Gantt scrolls. */

export function columnWidth(minWidth: number | undefined, fallback = 110): number {
  return minWidth ?? fallback
}

export function buildStickyMetaLayout(
  expandWidth: number,
  actionsWidth: number,
  columns: Array<{ minWidth?: number }>,
  fallback = 110,
) {
  const offsets: number[] = []
  let left = expandWidth + actionsWidth
  for (const column of columns) {
    offsets.push(left)
    left += columnWidth(column.minWidth, fallback)
  }

  return {
    /** Sticky `left` for each metadata column, in order. */
    offsets,
    /** Sticky `left` for the expand-detail block that spans metadata columns. */
    metaBlockLeft: expandWidth + actionsWidth,
    /** Total width of the metadata column block. */
    metaBlockWidth: left - expandWidth - actionsWidth,
    /** Right edge of the frozen left pane (for shadow). */
    frozenRightEdge: left,
  }
}

export const stickyEdgeShadow = '2px 0 6px rgba(0,0,0,0.12)'
