import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import { personBarColor } from './ganttPeriods'
import { getCurrentAuthorizationRequests } from './projectAuthorizationRevisions'
import { formatDisplayDate, generateBiWeeklyPeriodsForRange } from './staffingPlanDates'

export type PafRegisterColumnId =
  | 'pafNumber'
  | 'candidate'
  | 'position'
  | 'functionalGroup'
  | 'dsg'
  | 'country'
  | 'class'
  | 'company'
  | 'status'
  | 'revision'
  | 'roster'
  | 'totalHours'
  | 'startBiWeek'
  | 'lwp'

export interface PafRegisterColumnDef {
  id: PafRegisterColumnId
  label: string
  getValue: (row: PafRegisterRow) => string
  minWidth?: number
}

export interface PafRegisterRow {
  id: string
  request: ProjectAuthorizationRequest
  pafNumber: string
  candidate: string
  position: string
  functionalGroup: string
  dsg: string
  country: string
  class: string
  company: string
  status: string
  revision: string
  roster: string
  totalHours: string
  startBiWeek: string
  lwp: string
  startBiWeekRaw: string
  lwpRaw: string
  barColor: string
}

export const PAF_REGISTER_COLUMN_DEFS: PafRegisterColumnDef[] = [
  { id: 'pafNumber', label: 'PAF', getValue: (row) => row.pafNumber, minWidth: 100 },
  { id: 'candidate', label: 'Candidate', getValue: (row) => row.candidate, minWidth: 140 },
  { id: 'position', label: 'Position', getValue: (row) => row.position, minWidth: 140 },
  { id: 'functionalGroup', label: 'Functional Group', getValue: (row) => row.functionalGroup, minWidth: 140 },
  { id: 'dsg', label: 'DSG', getValue: (row) => row.dsg, minWidth: 160 },
  { id: 'country', label: 'Country', getValue: (row) => row.country },
  { id: 'class', label: 'Class', getValue: (row) => row.class, minWidth: 140 },
  { id: 'company', label: 'Company', getValue: (row) => row.company },
  { id: 'status', label: 'Status', getValue: (row) => row.status },
  { id: 'revision', label: 'Revision', getValue: (row) => row.revision },
  { id: 'roster', label: 'Roster', getValue: (row) => row.roster },
  { id: 'totalHours', label: 'Total Hours', getValue: (row) => row.totalHours },
  { id: 'startBiWeek', label: 'Start Bi-Week', getValue: (row) => row.startBiWeek, minWidth: 120 },
  { id: 'lwp', label: 'Last Working Day', getValue: (row) => row.lwp, minWidth: 140 },
]

export const DEFAULT_PAF_COLUMN_ORDER: PafRegisterColumnId[] =
  PAF_REGISTER_COLUMN_DEFS.map((column) => column.id)

const COLUMN_BY_ID = new Map(PAF_REGISTER_COLUMN_DEFS.map((column) => [column.id, column]))

/** Calendar periods covering all current PAF durations. */
export function getPafRegisterPeriods(
  requests: ProjectAuthorizationRequest[] = [],
): string[] {
  let minStart = ''
  let maxEnd = ''

  for (const request of getCurrentAuthorizationRequests(requests)) {
    if (!request.startBiWeek || !request.lwp) continue
    if (!minStart || request.startBiWeek < minStart) minStart = request.startBiWeek
    if (!maxEnd || request.lwp > maxEnd) maxEnd = request.lwp
  }

  if (!minStart || !maxEnd) {
    return generateBiWeeklyPeriodsForRange('2026-07-05', '2027-07-04')
  }
  return generateBiWeeklyPeriodsForRange(minStart, maxEnd)
}

export function getOrderedVisiblePafColumns(
  order: PafRegisterColumnId[],
  visibleIds: readonly PafRegisterColumnId[],
): PafRegisterColumnDef[] {
  const visible = new Set(visibleIds)
  const ordered = order
    .map((id) => COLUMN_BY_ID.get(id))
    .filter((column): column is PafRegisterColumnDef => column != null && visible.has(column.id))

  for (const column of PAF_REGISTER_COLUMN_DEFS) {
    if (visible.has(column.id) && !ordered.some((item) => item.id === column.id)) {
      ordered.push(column)
    }
  }
  return ordered
}

export function getUniquePafColumnValues(
  rows: PafRegisterRow[],
  columnId: PafRegisterColumnId,
): string[] {
  const column = COLUMN_BY_ID.get(columnId)
  if (!column) return []
  const values = new Set<string>()
  for (const row of rows) {
    const value = column.getValue(row).trim()
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function filterPafRegisterRows(
  rows: PafRegisterRow[],
  filters: Partial<Record<PafRegisterColumnId, string>>,
): PafRegisterRow[] {
  const active = Object.entries(filters).filter(([, value]) => Boolean(value)) as Array<
    [PafRegisterColumnId, string]
  >
  if (active.length === 0) return rows
  return rows.filter((row) =>
    active.every(([columnId, filterValue]) => {
      const column = COLUMN_BY_ID.get(columnId)
      if (!column) return true
      return column.getValue(row) === filterValue
    }),
  )
}

export function buildPafRegisterRows(
  requests: ProjectAuthorizationRequest[],
): PafRegisterRow[] {
  return getCurrentAuthorizationRequests(requests)
    .map((request) => ({
      id: request.id,
      request,
      pafNumber: request.pafNumber,
      candidate: request.candidateName,
      position: request.position,
      functionalGroup: request.functionalGroup,
      dsg: request.dsg,
      country: request.country,
      class: request.class,
      company: request.company,
      status: request.status,
      revision: String(request.revision),
      roster: request.roster,
      totalHours: request.totalHours,
      startBiWeek: formatDisplayDate(request.startBiWeek),
      lwp: formatDisplayDate(request.lwp),
      startBiWeekRaw: request.startBiWeek,
      lwpRaw: request.lwp,
      barColor: personBarColor(`${request.candidateName}:${request.revisionGroupId}`),
    }))
    .sort((a, b) => a.pafNumber.localeCompare(b.pafNumber, undefined, { numeric: true }))
}
