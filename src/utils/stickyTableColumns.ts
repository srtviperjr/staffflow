/** Shared sticky styles for freeze-left table panes (expand + actions). */

export const stickyEdgeShadow = '2px 0 6px rgba(0,0,0,0.12)'

/** Compact width for sticky expand-detail text while the calendar scrolls. */
export const STICKY_EXPAND_DETAIL_WIDTH = 420

export function stickyDetailLeft(expandWidth: number, actionsWidth: number) {
  return expandWidth + actionsWidth
}
