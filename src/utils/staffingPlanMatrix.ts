import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { getApprovedStaffingRequests } from './approvedPositions'
import { personBarColor } from './ganttPeriods'
import {
  findNextAvailablePafRange,
  getActiveAuthorizationForPosition,
  getActivePafsForPosition,
} from './projectAuthorizationRevisions'
import { generateBiWeeklyPeriods, parseDateInput } from './staffingPlanDates'

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
  authorization?: ProjectAuthorizationRequest
  /** True when another person can still be assigned without date overlap. */
  canAddPaf: boolean
  /** Active people on this position for calendar highlighting. */
  calendarPeople: MatrixCalendarPerson[]
  phase: string
  projectOffice: string
  functionalDsg: string
  area: string
  subArea: string
  country: string
  discipline: string
  position: string
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
  | 'phase'
  | 'projectOffice'
  | 'functionalDsg'
  | 'area'
  | 'subArea'
  | 'country'
  | 'discipline'
  | 'position'
  | 'candidate'
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
  { id: 'phase', label: 'Phase', getValue: (row) => row.phase, minWidth: 80 },
  { id: 'projectOffice', label: 'Project Office', getValue: (row) => row.projectOffice },
  { id: 'functionalDsg', label: 'Functional DSG', getValue: (row) => row.functionalDsg, minWidth: 160 },
  { id: 'area', label: 'Area', getValue: (row) => row.area },
  { id: 'subArea', label: 'Sub Area', getValue: (row) => row.subArea },
  { id: 'country', label: 'Country', getValue: (row) => row.country },
  { id: 'discipline', label: 'Discipline', getValue: (row) => row.discipline, minWidth: 140 },
  { id: 'position', label: 'Position', getValue: (row) => row.position, minWidth: 140 },
  { id: 'candidate', label: 'Candidate', getValue: (row) => row.candidate, minWidth: 140 },
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

export const DEFAULT_COLUMN_ORDER: MatrixColumnId[] = MATRIX_COLUMN_DEFS.map((column) => column.id)

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
  filters: Partial<Record<MatrixColumnId, string>>,
): StaffingMatrixRow[] {
  const active = Object.entries(filters).filter(([, value]) => Boolean(value)) as Array<
    [MatrixColumnId, string]
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

export function getMatrixPeriods(count = 16): string[] {
  return generateBiWeeklyPeriods(new Date(2026, 8, 27), count)
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
  const date = parseDateInput(value)
  if (!date) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
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
    authorization,
    canAddPaf,
    calendarPeople,
    phase: position.phase,
    projectOffice: position.locationType,
    functionalDsg: position.dsg,
    area: position.area,
    subArea: position.subArea,
    country: authorization?.country ?? position.country,
    discipline: position.discipline,
    position: position.position,
    candidate: authorization?.candidateName ?? 'None',
    class: authorization?.class ?? position.class,
    company: authorization?.company ?? position.company,
    eeIdSap: authorization?.eeIdSap ?? position.eeIdSap,
    paf: authorization?.pafNumber ?? 'None',
    sortNumber: authorization?.sortNumber ?? position.sortNumber,
    totalHours: authorization?.totalHours ?? position.totalHours,
    hoursToGo: position.hoursToGo,
    roster: authorization?.roster ?? position.roster,
    startBiWeek: formatMatrixDate(authorization?.startBiWeek ?? position.startBiWeek),
    lwp: formatMatrixDate(authorization?.lwp ?? position.lwp),
    locationCategory: toLocationCategory(position.locationType),
    loads,
  }
}

export function buildStaffingMatrixRows(
  staffingRequests: StaffingPlanRequest[],
  authorizations: ProjectAuthorizationRequest[],
  periods: string[],
): StaffingMatrixRow[] {
  const approvedPositions = getApprovedStaffingRequests(staffingRequests)

  return approvedPositions
    .map((position) => {
      const active = getActivePafsForPosition(position, authorizations, staffingRequests)
      return buildRow(
        position,
        getActiveAuthorizationForPosition(position, authorizations, staffingRequests),
        active,
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
