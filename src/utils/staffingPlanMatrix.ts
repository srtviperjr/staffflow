import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { getStaffingPlanMainRequests } from './approvedPositions'
import { personBarColor } from './ganttPeriods'
import {
  findNextAvailablePafRange,
  getActiveAuthorizationForPosition,
  getApprovedDisplayPafsForPosition,
} from './projectAuthorizationRevisions'
import {
  formatDisplayDate,
  generateBiWeeklyPeriodsForRange,
  parseDateInput,
} from './staffingPlanDates'

export type LocationCategory = 'Site - Comm' | 'Site - Const' | 'Office'

export interface MatrixCalendarPerson {
  id: string
  candidateName: string
  startBiWeek: string
  lwp: string
  color: string
  status: ProjectAuthorizationRequest['status']
}

export interface StaffingMatrixRow {
  id: string
  revisionGroupId: string
  /** Latest approved staffing revision shown as the main plan record. */
  positionRequest: StaffingPlanRequest
  authorization?: ProjectAuthorizationRequest
  /** True when another person can still be assigned without date overlap. */
  canAddPaf: boolean
  /** Active people (PAFs) on this position for calendar highlighting. */
  calendarPeople: MatrixCalendarPerson[]
  /** Position availability window (owned by the staffing revision, not the PAF). */
  positionStartBiWeek: string
  positionLwp: string
  phase: string
  projectOffice: string
  functionalDsg: string
  area: string
  subArea: string
  country: string
  discipline: string
  position: string
  positionNumber: string
  status: string
  candidate: string
  class: string
  company: string
  eeIdSap: string
  paf: string
  sortNumber: string
  totalHours: string
  hoursToGo: string
  roster: string
  startBiWeek: string
  lwp: string
  locationCategory: LocationCategory
  loads: Record<string, number | null>
}

export interface StaffingMatrixSummary {
  label: string
  values: Record<string, number>
}

export type MatrixColumnId =
  | 'positionNumber'
  | 'status'
  | 'candidate'
  | 'phase'
  | 'projectOffice'
  | 'functionalDsg'
  | 'area'
  | 'subArea'
  | 'country'
  | 'discipline'
  | 'position'
  | 'class'
  | 'company'
  | 'eeIdSap'
  | 'paf'
  | 'sortNumber'
  | 'totalHours'
  | 'hoursToGo'
  | 'roster'
  | 'startBiWeek'
  | 'lwp'

export interface MatrixColumnDef {
  id: MatrixColumnId
  label: string
  getValue: (row: StaffingMatrixRow) => string
  minWidth?: number
}

export const MATRIX_COLUMN_DEFS: MatrixColumnDef[] = [
  { id: 'positionNumber', label: 'Position #', getValue: (row) => row.positionNumber, minWidth: 120 },
  { id: 'status', label: 'Status', getValue: (row) => row.status, minWidth: 100 },
  { id: 'candidate', label: 'Candidate', getValue: (row) => row.candidate, minWidth: 140 },
  { id: 'phase', label: 'Phase', getValue: (row) => row.phase, minWidth: 80 },
  { id: 'projectOffice', label: 'Project Office', getValue: (row) => row.projectOffice },
  { id: 'functionalDsg', label: 'Functional DSG', getValue: (row) => row.functionalDsg, minWidth: 160 },
  { id: 'area', label: 'Area', getValue: (row) => row.area },
  { id: 'subArea', label: 'Sub Area', getValue: (row) => row.subArea },
  { id: 'country', label: 'Country', getValue: (row) => row.country },
  { id: 'discipline', label: 'Discipline', getValue: (row) => row.discipline, minWidth: 140 },
  { id: 'position', label: 'Position', getValue: (row) => row.position, minWidth: 140 },
  { id: 'class', label: 'Class', getValue: (row) => row.class, minWidth: 140 },
  { id: 'company', label: 'Company', getValue: (row) => row.company },
  { id: 'eeIdSap', label: 'EE Id # / SAP', getValue: (row) => row.eeIdSap },
  { id: 'paf', label: 'PAF', getValue: (row) => row.paf },
  { id: 'sortNumber', label: 'Sort Number', getValue: (row) => row.sortNumber },
  { id: 'totalHours', label: 'Total Hours', getValue: (row) => row.totalHours },
  { id: 'hoursToGo', label: 'HoursToGo', getValue: (row) => row.hoursToGo },
  { id: 'roster', label: 'Roster', getValue: (row) => row.roster },
  { id: 'startBiWeek', label: 'Start Bi-Week', getValue: (row) => row.startBiWeek, minWidth: 120 },
  { id: 'lwp', label: 'Last Working Day', getValue: (row) => row.lwp, minWidth: 140 },
]

/** Position #, Status, and Candidate lead by default. */
export const DEFAULT_COLUMN_ORDER: MatrixColumnId[] = [
  'positionNumber',
  'status',
  'candidate',
  'phase',
  'projectOffice',
  'functionalDsg',
  'area',
  'subArea',
  'country',
  'discipline',
  'position',
  'class',
  'company',
  'eeIdSap',
  'paf',
  'sortNumber',
  'totalHours',
  'hoursToGo',
  'roster',
  'startBiWeek',
  'lwp',
]

/** Columns frozen while scrolling the Gantt (in addition to Expand + Actions). */
export const DEFAULT_STICKY_COLUMNS: MatrixColumnId[] = ['positionNumber', 'status', 'candidate']

/** @deprecated Prefer MATRIX_COLUMN_DEFS — kept for any residual label lookups */
export const METADATA_COLUMNS = MATRIX_COLUMN_DEFS.map((column) => column.label)

const COLUMN_BY_ID = new Map(MATRIX_COLUMN_DEFS.map((column) => [column.id, column]))

const OFFICE_SUMMARY_DEMO = [74, 76, 69, 74, 76, 69, 78, 29, 78, 76, 72, 76, 74, 78, 74, 76]

export function getMatrixColumn(id: MatrixColumnId): MatrixColumnDef | undefined {
  return COLUMN_BY_ID.get(id)
}

export function getOrderedVisibleColumns(
  order: MatrixColumnId[],
  visibleIds: readonly MatrixColumnId[],
): MatrixColumnDef[] {
  const visible = new Set(visibleIds)
  const ordered = order
    .map((id) => COLUMN_BY_ID.get(id))
    .filter((column): column is MatrixColumnDef => column != null && visible.has(column.id))

  // Include any newly added columns that weren't in persisted order
  for (const column of MATRIX_COLUMN_DEFS) {
    if (visible.has(column.id) && !ordered.some((item) => item.id === column.id)) {
      ordered.push(column)
    }
  }

  return ordered
}

export function getUniqueColumnValues(rows: StaffingMatrixRow[], columnId: MatrixColumnId): string[] {
  const column = COLUMN_BY_ID.get(columnId)
  if (!column) return []
  const values = new Set<string>()
  for (const row of rows) {
    const value = column.getValue(row).trim()
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function filterMatrixRows(
  rows: StaffingMatrixRow[],
  filters: Partial<Record<MatrixColumnId, string[]>>,
): StaffingMatrixRow[] {
  const active = Object.entries(filters).filter(
    ([, values]) => Array.isArray(values) && values.length > 0,
  ) as Array<[MatrixColumnId, string[]]>
  if (active.length === 0) return rows

  return rows.filter((row) =>
    active.every(([columnId, filterValues]) => {
      const column = COLUMN_BY_ID.get(columnId)
      if (!column) return true
      return filterValues.includes(column.getValue(row))
    }),
  )
}

/** Calendar periods covering all position and PAF durations in the plan. */
export function getMatrixPeriods(
  staffingRequests: StaffingPlanRequest[] = [],
  authorizations: ProjectAuthorizationRequest[] = [],
): string[] {
  let minStart = ''
  let maxEnd = ''

  const consider = (start: string, end: string) => {
    if (!start || !end) return
    if (!minStart || start < minStart) minStart = start
    if (!maxEnd || end > maxEnd) maxEnd = end
  }

  for (const request of staffingRequests) {
    if (request.status === 'approved' || request.isCurrentRevision) {
      consider(request.startBiWeek, request.lwp)
    }
  }
  for (const request of authorizations) {
    if (request.isCurrentRevision) {
      consider(request.startBiWeek, request.lwp)
    }
  }

  if (!minStart || !maxEnd) {
    return generateBiWeeklyPeriodsForRange('2026-07-05', '2027-07-04')
  }
  return generateBiWeeklyPeriodsForRange(minStart, maxEnd)
}

function toLocationCategory(locationType: string): LocationCategory {
  if (locationType === 'Site - Comm') return 'Site - Comm'
  if (locationType === 'Site - Const') return 'Site - Const'
  return 'Office'
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function generateDemoLoad(rowId: string, period: string, startBiWeek: string, lwp: string): number | null {
  const start = parseDateInput(startBiWeek)
  const end = parseDateInput(lwp)
  const current = parseDateInput(period)
  if (!start || !end || !current) return null
  if (current < start || current > end) return null

  const hash = hashString(`${rowId}:${period}`)
  const load = 0.15 + (hash % 86) / 100
  return Math.round(load * 100) / 100
}

function formatMatrixDate(value: string): string {
  return formatDisplayDate(value)
}

function toCalendarPeople(assignments: ProjectAuthorizationRequest[]): MatrixCalendarPerson[] {
  return assignments
    .slice()
    .sort((a, b) => a.startBiWeek.localeCompare(b.startBiWeek))
    .map((request) => ({
      id: request.id,
      candidateName: request.candidateName,
      startBiWeek: request.startBiWeek,
      lwp: request.lwp,
      color: personBarColor(`${request.candidateName}:${request.revisionGroupId}`),
      status: request.status,
    }))
}

function buildRow(
  position: StaffingPlanRequest,
  authorization: ProjectAuthorizationRequest | undefined,
  activeAssignments: ProjectAuthorizationRequest[],
  canAddPaf: boolean,
  periods: string[],
): StaffingMatrixRow {
  const approvedAssignments = activeAssignments.filter((request) => request.status === 'approved')
  const calendarPeople = toCalendarPeople(activeAssignments)

  // Load demo values follow people filling the position; empty when unfilled.
  const loads = Object.fromEntries(
    periods.map((period) => {
      for (const assignment of approvedAssignments) {
        const load = generateDemoLoad(
          assignment.id,
          period,
          assignment.startBiWeek,
          assignment.lwp,
        )
        if (load != null) return [period, load]
      }
      return [period, null]
    }),
  ) as Record<string, number | null>

  return {
    id: position.id,
    revisionGroupId: position.revisionGroupId,
    positionRequest: position,
    authorization,
    canAddPaf,
    calendarPeople,
    positionStartBiWeek: position.startBiWeek,
    positionLwp: position.lwp,
    phase: position.phase,
    projectOffice: position.locationType,
    functionalDsg: position.dsg,
    area: position.area,
    subArea: position.subArea,
    // Position particulars come from the staffing revision; candidate/PAF from the person assignment.
    country: position.country,
    discipline: position.discipline,
    position: position.position,
    positionNumber: position.positionNumber,
    status: position.status,
    candidate: authorization?.candidateName ?? 'None',
    class: position.class,
    company: position.company,
    eeIdSap: position.eeIdSap,
    paf: authorization?.pafNumber ?? 'None',
    sortNumber: position.sortNumber,
    totalHours: position.totalHours,
    hoursToGo: position.hoursToGo,
    roster: position.roster,
    startBiWeek: formatMatrixDate(position.startBiWeek),
    lwp: formatMatrixDate(position.lwp),
    locationCategory: toLocationCategory(position.locationType),
    loads,
  }
}

export function buildStaffingMatrixRows(
  staffingRequests: StaffingPlanRequest[],
  authorizations: ProjectAuthorizationRequest[],
  periods: string[],
): StaffingMatrixRow[] {
  // Latest approved per group; first/pending-only groups still appear (like PAF Register).
  const mainPositions = getStaffingPlanMainRequests(staffingRequests)

  return mainPositions
    .map((position) => {
      // Main row shows approved PAFs when revisions exist; pending stay under expand.
      const displayPafs = getApprovedDisplayPafsForPosition(
        position,
        authorizations,
        staffingRequests,
      )
      return buildRow(
        position,
        getActiveAuthorizationForPosition(position, authorizations, staffingRequests),
        displayPafs,
        Boolean(findNextAvailablePafRange(position, authorizations, staffingRequests)),
        periods,
      )
    })
    .sort((a, b) => a.sortNumber.localeCompare(b.sortNumber, undefined, { numeric: true }))
}

export function buildSummaryRows(periods: string[]): StaffingMatrixSummary[] {
  const siteComm = Object.fromEntries(periods.map((period) => [period, 105]))
  const siteConst = Object.fromEntries(periods.map((period) => [period, 88]))
  const office = Object.fromEntries(
    periods.map((period, index) => [period, OFFICE_SUMMARY_DEMO[index % OFFICE_SUMMARY_DEMO.length]]),
  )

  return [
    { label: 'Site - Comm', values: siteComm },
    { label: 'Site - Const', values: siteConst },
    { label: 'Office', values: office },
  ]
}

export function getRowMetadataValues(row: StaffingMatrixRow): string[] {
  return MATRIX_COLUMN_DEFS.map((column) => column.getValue(row))
}
