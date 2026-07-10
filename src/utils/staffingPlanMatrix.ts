import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { getApprovedStaffingRequests } from './approvedPositions'
import { generateBiWeeklyPeriods, parseDateInput } from './staffingPlanDates'

export type LocationCategory = 'Site - Comm' | 'Site - Const' | 'Office'

export interface StaffingMatrixRow {
  id: string
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
  hiringSource: string
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

const METADATA_COLUMNS = [
  'Phase',
  'Project Office',
  'Functional DSG',
  'Area',
  'Sub Area',
  'Country',
  'Discipline',
  'Position',
  'Candidate',
  'Class',
  'Hiring Source',
  'EE Id # / SAP',
  'PAF',
  'Sort Number',
  'Total Hours',
  'HoursToGo',
  'Roster',
  'Start Bi-Week',
  'LWP',
] as const

const OFFICE_SUMMARY_DEMO = [74, 76, 69, 74, 76, 69, 78, 29, 78, 76, 72, 76, 74, 78, 74, 76]

export { METADATA_COLUMNS }

export function getMatrixPeriods(count = 16): string[] {
  return generateBiWeeklyPeriods(new Date(2026, 8, 27), count)
}

function getApprovedAuthorizations(requests: ProjectAuthorizationRequest[]) {
  return requests.filter((request) => request.status === 'approved')
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

function buildRow(
  position: StaffingPlanRequest,
  authorization: ProjectAuthorizationRequest | undefined,
  periods: string[],
): StaffingMatrixRow {
  const isAuthorized = Boolean(authorization)
  const rowId = authorization?.id ?? position.id

  const loads = Object.fromEntries(
    periods.map((period) => [
      period,
      isAuthorized
        ? generateDemoLoad(rowId, period, authorization!.startBiWeek, authorization!.lwp)
        : null,
    ]),
  ) as Record<string, number | null>

  return {
    id: rowId,
    phase: position.phase,
    projectOffice: position.locationType,
    functionalDsg: position.dsg,
    area: position.area,
    subArea: position.subArea,
    country: authorization?.country ?? position.country,
    discipline: position.discipline,
    position: position.position,
    candidate: authorization?.candidateName ?? 'Vacant',
    class: authorization?.class ?? position.class,
    hiringSource: authorization?.hiringSource ?? position.hiringSource,
    eeIdSap: authorization?.eeIdSap ?? position.eeIdSap,
    paf: '—',
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
  const authByPositionId = new Map(
    getApprovedAuthorizations(authorizations).map((auth) => [auth.staffingPlanRequestId, auth]),
  )

  return approvedPositions
    .map((position) => buildRow(position, authByPositionId.get(position.id), periods))
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
  return [
    row.phase,
    row.projectOffice,
    row.functionalDsg,
    row.area,
    row.subArea,
    row.country,
    row.discipline,
    row.position,
    row.candidate,
    row.class,
    row.hiringSource,
    row.eeIdSap,
    row.paf,
    row.sortNumber,
    row.totalHours,
    row.hoursToGo,
    row.roster,
    row.startBiWeek,
    row.lwp,
  ]
}
