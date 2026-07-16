import type { Company } from '../constants/companies'
import { COMPANIES, defaultPhaseForCompany } from '../constants/companies'
import {
  AREAS,
  CLASSES,
  COUNTRIES,
  DISCIPLINES,
  DSG_OPTIONS,
  FUNCTIONAL_GROUPS,
  LOCATION_TYPES,
  POSITIONS,
  ROSTERS,
  SUB_AREAS,
} from '../constants/staffingPlanOptions'
import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import type { WorkflowProgress } from '../types/workflow'
import { formatApprovedPositionLabel } from '../utils/approvedPositions'
import {
  dateRangesOverlap,
  findNextAvailablePafRange,
  getActivePafsForPosition,
  isActivePafStatus,
} from '../utils/pafDateRules'
import { formatPafNumber, maxPafSequence } from '../utils/projectAuthorizationRevisions'
import { formatDateInput, parseDateInput } from '../utils/staffingPlanDates'
import { markSeedCurrent } from './seedVersion'

const STAFFING_STORAGE_KEY = 'staffing-plan-requests'
const PAF_STORAGE_KEY = 'project-authorization-requests'

const SUBMITTED_BASE = new Date('2026-06-01T09:00:00.000Z').getTime()
const POSITION_WINDOW_START = '2026-07-05' // bi-weekly Sunday
const POSITION_WINDOW_BIWEEKS = 26

/** Default bootstrap dataset size (positions + PAF logical records). */
const DEFAULT_BOOTSTRAP_RECORD_COUNT = 280
const DEFAULT_BOOTSTRAP_POSITION_RATIO = 0.64

const FIRST_NAMES = [
  'Jane',
  'Priya',
  'Tom',
  'Carlos',
  'Elena',
  'Noah',
  'Aisha',
  'Marcus',
  'Sofia',
  'Liam',
  'Hiro',
  'Amara',
  'Owen',
  'Fatima',
  'Diego',
  'Chloe',
  'Raj',
  'Nora',
  'Ethan',
  'Mei',
] as const

const LAST_NAMES = [
  'Smith',
  'Sharma',
  'Wilson',
  'Mendez',
  'Vasquez',
  'Berger',
  'Okoro',
  'Chen',
  'Patel',
  'Nguyen',
  'Kowalski',
  'Andersson',
  'Silva',
  'Kim',
  'Brown',
  'Garcia',
  'Murphy',
  'Singh',
  'Rossi',
  'Ali',
] as const

export type SampleDataMode = 'replace' | 'append'

export type GenerateSampleDataOptions = {
  /** Total logical records = position groups + distinct PAF numbers. */
  recordCount: number
  /** Fraction (0–1) of records that are staffing positions; remainder are PAFs. */
  positionRatio: number
  existingStaffing?: StaffingPlanRequest[]
  existingAuthorizations?: ProjectAuthorizationRequest[]
  /** Prefix for generated ids (unique when appending). */
  idPrefix?: string
}

export type GeneratedSampleData = {
  staffing: StaffingPlanRequest[]
  authorizations: ProjectAuthorizationRequest[]
  summary: {
    positionGroups: number
    pafNumbers: number
    staffingRows: number
    pafRows: number
  }
}

export type ApplySampleDataOptions = {
  mode: SampleDataMode
  recordCount: number
  positionRatio: number
}

function submittedAt(offsetDays: number) {
  return new Date(SUBMITTED_BASE + offsetDays * 86_400_000).toISOString()
}

function reviewedAt(offsetDays: number) {
  return new Date(SUBMITTED_BASE + offsetDays * 86_400_000 + 3_600_000).toISOString()
}

function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length]
}

function addBiWeeks(value: string, biWeeks: number): string {
  const date = parseDateInput(value)
  if (!date) return value
  date.setDate(date.getDate() + biWeeks * 14)
  return formatDateInput(date)
}

function candidateName(seed: number) {
  return `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed * 3 + 1)}`
}

function staffingPendingWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Bantrel' ? 'sp-review-bantrel' : 'sp-review-other'
  return {
    workflowId: 'workflow-staffing-plan-approval',
    currentNodeId: reviewNode,
    history: [
      { nodeId: 'sp-start', arrivedAt: submittedAt(0) },
      { nodeId: 'sp-submit', arrivedAt: submittedAt(0) },
      {
        nodeId: 'sp-hiring-gate',
        arrivedAt: submittedAt(0),
        branch: company === 'Bantrel' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(0) },
    ],
  }
}

function staffingApprovedWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Bantrel' ? 'sp-review-bantrel' : 'sp-review-other'
  return {
    workflowId: 'workflow-staffing-plan-approval',
    currentNodeId: 'sp-end-ok',
    history: [
      { nodeId: 'sp-start', arrivedAt: submittedAt(0) },
      { nodeId: 'sp-submit', arrivedAt: submittedAt(0) },
      {
        nodeId: 'sp-hiring-gate',
        arrivedAt: submittedAt(0),
        branch: company === 'Bantrel' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(0) },
      { nodeId: 'sp-decision', arrivedAt: submittedAt(1), branch: 'yes' },
      { nodeId: 'sp-approved', arrivedAt: submittedAt(1) },
      { nodeId: 'sp-end-ok', arrivedAt: submittedAt(1) },
    ],
  }
}

function staffingRejectedWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Bantrel' ? 'sp-review-bantrel' : 'sp-review-other'
  return {
    workflowId: 'workflow-staffing-plan-approval',
    currentNodeId: 'sp-end-reject',
    history: [
      { nodeId: 'sp-start', arrivedAt: submittedAt(0) },
      { nodeId: 'sp-submit', arrivedAt: submittedAt(0) },
      {
        nodeId: 'sp-hiring-gate',
        arrivedAt: submittedAt(0),
        branch: company === 'Bantrel' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(0) },
      { nodeId: 'sp-decision', arrivedAt: submittedAt(1), branch: 'no' },
      { nodeId: 'sp-rejected', arrivedAt: submittedAt(1) },
      { nodeId: 'sp-end-reject', arrivedAt: submittedAt(1) },
    ],
  }
}

function pafPendingWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
  return {
    workflowId: 'workflow-paf-approval',
    currentNodeId: reviewNode,
    history: [
      { nodeId: 'paf-start', arrivedAt: submittedAt(11) },
      { nodeId: 'paf-submit', arrivedAt: submittedAt(11) },
      {
        nodeId: 'paf-class-gate',
        arrivedAt: submittedAt(11),
        branch: company === 'Fluor' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(11) },
    ],
  }
}

function pafApprovedWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
  return {
    workflowId: 'workflow-paf-approval',
    currentNodeId: 'paf-end-ok',
    history: [
      { nodeId: 'paf-start', arrivedAt: submittedAt(11) },
      { nodeId: 'paf-submit', arrivedAt: submittedAt(11) },
      {
        nodeId: 'paf-class-gate',
        arrivedAt: submittedAt(11),
        branch: company === 'Fluor' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(11) },
      { nodeId: 'paf-decision', arrivedAt: submittedAt(12), branch: 'yes' },
      { nodeId: 'paf-approved', arrivedAt: submittedAt(12) },
      { nodeId: 'paf-end-ok', arrivedAt: submittedAt(12) },
    ],
  }
}

function pafRejectedWorkflow(company: string): WorkflowProgress {
  const reviewNode = company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
  return {
    workflowId: 'workflow-paf-approval',
    currentNodeId: 'paf-end-reject',
    history: [
      { nodeId: 'paf-start', arrivedAt: submittedAt(11) },
      { nodeId: 'paf-submit', arrivedAt: submittedAt(11) },
      {
        nodeId: 'paf-class-gate',
        arrivedAt: submittedAt(11),
        branch: company === 'Fluor' ? 'yes' : 'no',
      },
      { nodeId: reviewNode, arrivedAt: submittedAt(11) },
      { nodeId: 'paf-decision', arrivedAt: submittedAt(12), branch: 'no' },
      { nodeId: 'paf-rejected', arrivedAt: submittedAt(12) },
      { nodeId: 'paf-end-reject', arrivedAt: submittedAt(12) },
    ],
  }
}

function buildStaffingPosition(
  company: Company,
  index: number,
  overrides: Partial<StaffingPlanRequest> & {
    id: string
    revisionGroupId: string
    revision: number
    isCurrentRevision: boolean
    status: StaffingPlanRequest['status']
  },
): StaffingPlanRequest {
  const seed = COMPANIES.indexOf(company) * 100 + index
  const startBiWeek = overrides.startBiWeek ?? addBiWeeks(POSITION_WINDOW_START, index % 3)
  const lwp = overrides.lwp ?? addBiWeeks(startBiWeek, POSITION_WINDOW_BIWEEKS)

  return {
    id: overrides.id,
    revisionGroupId: overrides.revisionGroupId,
    revision: overrides.revision,
    supersedesId: overrides.supersedesId,
    isCurrentRevision: overrides.isCurrentRevision,
    positionNumber:
      overrides.positionNumber ??
      `${company.slice(0, 2).toUpperCase()}${String(index + 1).padStart(3, '0')}`,
    phase: overrides.phase ?? defaultPhaseForCompany(company),
    locationType: overrides.locationType ?? pick(LOCATION_TYPES, seed),
    functionalGroup: overrides.functionalGroup ?? pick(FUNCTIONAL_GROUPS, seed),
    dsg: overrides.dsg ?? pick(DSG_OPTIONS, seed + 2),
    area: overrides.area ?? pick(AREAS, seed + 1),
    subArea: overrides.subArea ?? pick(SUB_AREAS, seed),
    country: overrides.country ?? pick(COUNTRIES, seed + 4),
    discipline: overrides.discipline ?? pick(DISCIPLINES, seed + 3),
    position: overrides.position ?? pick(POSITIONS, seed + 5),
    class: overrides.class ?? pick(CLASSES, seed + 6),
    company,
    eeIdSap: overrides.eeIdSap ?? '',
    sortNumber: overrides.sortNumber ?? String(1000 + seed),
    totalHours: overrides.totalHours ?? String(1600 + (seed % 8) * 80),
    hoursToGo: overrides.hoursToGo ?? String(800 + (seed % 6) * 40),
    roster: overrides.roster ?? pick(ROSTERS, seed),
    startBiWeek,
    lwp,
    status: overrides.status,
    submittedAt: overrides.submittedAt ?? submittedAt(index),
    reviewedAt: overrides.reviewedAt,
    rejectionComment: overrides.rejectionComment,
    workflow: overrides.workflow,
  }
}

function pafForPosition(
  position: StaffingPlanRequest,
  overrides: Partial<ProjectAuthorizationRequest> & {
    id: string
    candidateName: string
    pafNumber: string
    status: ProjectAuthorizationRequest['status']
    startBiWeek: string
    lwp: string
  },
): ProjectAuthorizationRequest {
  return {
    id: overrides.id,
    revisionGroupId: overrides.revisionGroupId ?? overrides.id,
    revision: overrides.revision ?? 1,
    supersedesId: overrides.supersedesId,
    isCurrentRevision: overrides.isCurrentRevision ?? true,
    staffingPlanRequestId: position.id,
    functionalGroup: position.functionalGroup,
    dsg: position.dsg,
    approvedPositionLabel: formatApprovedPositionLabel(position),
    position: position.position,
    candidateName: overrides.candidateName,
    country: overrides.country ?? position.country,
    class: overrides.class ?? position.class,
    company: overrides.company ?? position.company,
    eeIdSap: overrides.eeIdSap ?? '',
    pafNumber: overrides.pafNumber,
    sortNumber: overrides.sortNumber ?? position.sortNumber,
    totalHours: overrides.totalHours ?? position.totalHours,
    roster: overrides.roster ?? position.roster,
    startBiWeek: overrides.startBiWeek,
    lwp: overrides.lwp,
    status: overrides.status,
    submittedAt: overrides.submittedAt ?? submittedAt(20),
    reviewedAt: overrides.reviewedAt,
    rejectionComment: overrides.rejectionComment,
    workflow: overrides.workflow,
  }
}

function aStartsBeforePosition(
  request: ProjectAuthorizationRequest,
  position: StaffingPlanRequest,
) {
  const start = parseDateInput(request.startBiWeek)
  const available = parseDateInput(position.startBiWeek)
  if (!start || !available) return true
  return start.getTime() < available.getTime()
}

/** One PAF number always belongs to exactly one person (across all revisions). */
export function assertPafNumberOwnsOnePerson(authorizations: ProjectAuthorizationRequest[]) {
  const byPaf = new Map<string, string>()
  for (const request of authorizations) {
    const existing = byPaf.get(request.pafNumber)
    if (existing && existing !== request.candidateName) {
      throw new Error(
        `PAF ${request.pafNumber} has multiple people: "${existing}" and "${request.candidateName}"`,
      )
    }
    byPaf.set(request.pafNumber, request.candidateName)
  }
}

export function assertNoActivePafOverlaps(
  staffing: StaffingPlanRequest[],
  authorizations: ProjectAuthorizationRequest[],
) {
  const currentPositions = staffing.filter((request) => request.isCurrentRevision)
  for (const position of currentPositions) {
    const active = getActivePafsForPosition(position, authorizations, staffing)
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i]
        const b = active[j]
        if (
          dateRangesOverlap(
            { startBiWeek: a.startBiWeek, lwp: a.lwp },
            { startBiWeek: b.startBiWeek, lwp: b.lwp },
          )
        ) {
          throw new Error(
            `Sample data overlap on ${position.id}: ${a.pafNumber} (${a.startBiWeek}-${a.lwp}) vs ${b.pafNumber} (${b.startBiWeek}-${b.lwp})`,
          )
        }
      }
      if (aStartsBeforePosition(active[i], position)) {
        throw new Error(
          `Sample PAF ${active[i].pafNumber} starts before position ${position.id} availability`,
        )
      }
      if (active[i].lwp > position.lwp) {
        throw new Error(`Sample PAF ${active[i].pafNumber} ends after position ${position.id} LWP`)
      }
    }
  }
}

function distributeCount(total: number, buckets: number): number[] {
  if (buckets <= 0) return []
  const base = Math.floor(total / buckets)
  const remainder = total % buckets
  return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0))
}

function nextPositionIndexByCompany(
  company: Company,
  existing: StaffingPlanRequest[],
): number {
  const prefix = company.slice(0, 2).toUpperCase()
  let max = 0
  for (const request of existing) {
    if (request.company !== company) continue
    const match = new RegExp(`^${prefix}(\\d{3})$`).exec(request.positionNumber)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max
}

function latestApprovedForGroup(
  staffing: StaffingPlanRequest[],
  revisionGroupId: string,
): StaffingPlanRequest | undefined {
  return staffing
    .filter((request) => request.revisionGroupId === revisionGroupId && request.status === 'approved')
    .sort((a, b) => b.revision - a.revision)[0]
}

function readStoredStaffing(): StaffingPlanRequest[] {
  try {
    const stored = localStorage.getItem(STAFFING_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as StaffingPlanRequest[]
  } catch {
    return []
  }
}

function readStoredAuthorizations(): ProjectAuthorizationRequest[] {
  try {
    const stored = localStorage.getItem(PAF_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as ProjectAuthorizationRequest[]
  } catch {
    return []
  }
}

/**
 * Generate position groups and PAF person-assignments that follow app rules:
 * - one PAF number = one person (revisions never change the person)
 * - PAFs only attach to approved positions
 * - active PAFs on a position never overlap
 */
export function generateSampleData(options: GenerateSampleDataOptions): GeneratedSampleData {
  const recordCount = Math.max(0, Math.floor(options.recordCount))
  const positionRatio = Math.min(1, Math.max(0, options.positionRatio))
  const existingStaffing = options.existingStaffing ?? []
  const existingAuthorizations = options.existingAuthorizations ?? []
  const idPrefix = options.idPrefix ?? 'sample'

  let positionGroups = Math.round(recordCount * positionRatio)
  let pafNumbersTarget = recordCount - positionGroups
  if (recordCount > 0 && positionGroups === 0 && pafNumbersTarget > 0) {
    // Need at least some approved positions to host PAFs.
    positionGroups = Math.min(recordCount, Math.max(1, Math.ceil(pafNumbersTarget / 2)))
    pafNumbersTarget = recordCount - positionGroups
  }

  const staffing: StaffingPlanRequest[] = []
  const authorizations: ProjectAuthorizationRequest[] = []
  let pafCounter = maxPafSequence(existingAuthorizations) + 1
  const allocatePafNumber = () => formatPafNumber(pafCounter++)

  const positionsPerCompany = distributeCount(positionGroups, COMPANIES.length)
  const companyPositionIndexes: Record<Company, number> = {
    BHP: nextPositionIndexByCompany('BHP', existingStaffing),
    Hatch: nextPositionIndexByCompany('Hatch', existingStaffing),
    Bantrel: nextPositionIndexByCompany('Bantrel', existingStaffing),
    Fluor: nextPositionIndexByCompany('Fluor', existingStaffing),
  }

  const approvedPositionsByCompany: Record<Company, StaffingPlanRequest[]> = {
    BHP: [],
    Hatch: [],
    Bantrel: [],
    Fluor: [],
  }

  // Seed approved-position pools from existing data when appending.
  for (const company of COMPANIES) {
    const groups = new Set(
      existingStaffing.filter((request) => request.company === company).map((r) => r.revisionGroupId),
    )
    for (const groupId of groups) {
      const approved = latestApprovedForGroup(existingStaffing, groupId)
      if (approved) approvedPositionsByCompany[company].push(approved)
    }
  }

  COMPANIES.forEach((company, companyIndex) => {
    const count = positionsPerCompany[companyIndex] ?? 0
    for (let i = 0; i < count; i += 1) {
      companyPositionIndexes[company] += 1
      const index = companyPositionIndexes[company]
      const groupId = `${idPrefix}-sp-${company.toLowerCase()}-${String(index).padStart(3, '0')}`
      const statusRoll = (companyIndex + i) % 10
      // Bias toward approved so PAFs have hosts; keep some pending/rejected for demos.
      const status: StaffingPlanRequest['status'] =
        statusRoll === 8 ? 'pending' : statusRoll === 9 ? 'rejected' : 'approved'

      const startBiWeek = addBiWeeks(POSITION_WINDOW_START, (companyIndex + i) % 3)
      const lwp = addBiWeeks(startBiWeek, POSITION_WINDOW_BIWEEKS)
      const approvedThenApproved = status === 'approved' && (companyIndex + i) % 9 === 0
      const approvedThenPending = status === 'approved' && (companyIndex + i) % 9 === 3
      const positionNumber = `${company.slice(0, 2).toUpperCase()}${String(index).padStart(3, '0')}`

      if (approvedThenApproved || approvedThenPending) {
        const revisionTwoStatus: StaffingPlanRequest['status'] = approvedThenPending
          ? 'pending'
          : 'approved'
        const revisionTwoLwp = approvedThenApproved ? addBiWeeks(lwp, 2) : lwp

        staffing.push(
          buildStaffingPosition(company, index, {
            id: `${groupId}-r1`,
            revisionGroupId: groupId,
            revision: 1,
            isCurrentRevision: false,
            status: 'approved',
            positionNumber,
            startBiWeek,
            lwp,
            submittedAt: submittedAt(index),
            reviewedAt: reviewedAt(index + 1),
            workflow: staffingApprovedWorkflow(company),
            totalHours: '1200',
          }),
        )
        staffing.push(
          buildStaffingPosition(company, index, {
            id: `${groupId}-r2`,
            revisionGroupId: groupId,
            revision: 2,
            supersedesId: `${groupId}-r1`,
            isCurrentRevision: true,
            status: revisionTwoStatus,
            positionNumber,
            startBiWeek,
            lwp: revisionTwoLwp,
            submittedAt: submittedAt(index + 2),
            reviewedAt: revisionTwoStatus === 'approved' ? reviewedAt(index + 3) : undefined,
            workflow:
              revisionTwoStatus === 'approved'
                ? staffingApprovedWorkflow(company)
                : staffingPendingWorkflow(company),
            totalHours: '1800',
            hoursToGo: '900',
          }),
        )
      } else {
        staffing.push(
          buildStaffingPosition(company, index, {
            id: groupId,
            revisionGroupId: groupId,
            revision: 1,
            isCurrentRevision: true,
            status,
            positionNumber,
            startBiWeek,
            lwp,
            submittedAt: submittedAt(index),
            reviewedAt: status === 'pending' ? undefined : reviewedAt(index + 1),
            rejectionComment:
              status === 'rejected' ? 'Position budget not approved for this phase.' : undefined,
            workflow:
              status === 'approved'
                ? staffingApprovedWorkflow(company)
                : status === 'rejected'
                  ? staffingRejectedWorkflow(company)
                  : staffingPendingWorkflow(company),
          }),
        )
      }

      const approved = latestApprovedForGroup(staffing, groupId)
      if (approved) approvedPositionsByCompany[company].push(approved)
    }
  })

  const allStaffingForRules = [...existingStaffing, ...staffing]
  const workingAuthorizations = [...existingAuthorizations]
  const pafsPerCompany = distributeCount(pafNumbersTarget, COMPANIES.length)
  let createdPafNumbers = 0
  let pafSeq = 0

  const ensureApprovedPosition = (company: Company): StaffingPlanRequest => {
    const pool = approvedPositionsByCompany[company]
    const withRoom = pool.find((position) =>
      findNextAvailablePafRange(position, workingAuthorizations, allStaffingForRules),
    )
    if (withRoom) return withRoom

    // Create an extra approved host position when the quota still needs PAF slots.
    companyPositionIndexes[company] += 1
    const index = companyPositionIndexes[company]
    const groupId = `${idPrefix}-sp-extra-${company.toLowerCase()}-${String(index).padStart(3, '0')}`
    const startBiWeek = addBiWeeks(POSITION_WINDOW_START, index % 3)
    const lwp = addBiWeeks(startBiWeek, POSITION_WINDOW_BIWEEKS)
    const positionNumber = `${company.slice(0, 2).toUpperCase()}${String(index).padStart(3, '0')}`
    const host = buildStaffingPosition(company, index, {
      id: groupId,
      revisionGroupId: groupId,
      revision: 1,
      isCurrentRevision: true,
      status: 'approved',
      positionNumber,
      startBiWeek,
      lwp,
      submittedAt: submittedAt(index),
      reviewedAt: reviewedAt(index + 1),
      workflow: staffingApprovedWorkflow(company),
    })
    staffing.push(host)
    allStaffingForRules.push(host)
    pool.push(host)
    return host
  }

  COMPANIES.forEach((company, companyIndex) => {
    let remaining = pafsPerCompany[companyIndex] ?? 0
    while (remaining > 0) {
      const position = ensureApprovedPosition(company)
      const range = findNextAvailablePafRange(position, workingAuthorizations, allStaffingForRules)
      if (!range) {
        // Force a fresh host if the selected position somehow has no window.
        approvedPositionsByCompany[company] = approvedPositionsByCompany[company].filter(
          (item) => item.id !== position.id,
        )
        continue
      }

      const pattern = pafSeq % 6
      pafSeq += 1
      const seed = COMPANIES.indexOf(company) * 1000 + pafSeq
      const midEnd = addBiWeeks(range.startBiWeek, Math.max(2, Math.floor(POSITION_WINDOW_BIWEEKS / 4)))
      const firstEnd = midEnd <= range.lwp ? midEnd : range.lwp
      const secondStart = addBiWeeks(firstEnd, 1)
      const canSplit = remaining >= 2 && secondStart <= range.lwp

      if (pattern === 3 && canSplit) {
        // Two sequential people on the same position (two PAF numbers), non-overlapping.
        const first = pafForPosition(position, {
          id: `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}-a`,
          candidateName: candidateName(seed),
          pafNumber: allocatePafNumber(),
          status: 'approved',
          startBiWeek: range.startBiWeek,
          lwp: firstEnd,
          submittedAt: submittedAt(30 + pafSeq),
          reviewedAt: reviewedAt(31 + pafSeq),
          workflow: pafApprovedWorkflow(company),
        })
        const second = pafForPosition(position, {
          id: `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}-b`,
          candidateName: candidateName(seed + 17),
          pafNumber: allocatePafNumber(),
          status: 'approved',
          startBiWeek: secondStart,
          lwp: range.lwp,
          submittedAt: submittedAt(32 + pafSeq),
          reviewedAt: reviewedAt(33 + pafSeq),
          workflow: pafApprovedWorkflow(company),
        })
        authorizations.push(first, second)
        workingAuthorizations.push(first, second)
        createdPafNumbers += 2
        remaining -= 2
        continue
      }

      if (pattern === 2 && remaining >= 2) {
        // Rejected candidate replaced by a different person/PAF on the same window.
        const rejected = pafForPosition(position, {
          id: `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}-rej`,
          candidateName: candidateName(seed),
          pafNumber: allocatePafNumber(),
          status: 'rejected',
          startBiWeek: range.startBiWeek,
          lwp: firstEnd,
          submittedAt: submittedAt(30 + pafSeq),
          reviewedAt: reviewedAt(31 + pafSeq),
          rejectionComment: 'Candidate does not meet minimum experience requirements.',
          workflow: pafRejectedWorkflow(company),
        })
        const replacementName = candidateName(seed + 11)
        const replacement = pafForPosition(position, {
          id: `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}-a`,
          candidateName: replacementName,
          pafNumber: allocatePafNumber(),
          status: 'approved',
          startBiWeek: range.startBiWeek,
          lwp: firstEnd,
          submittedAt: submittedAt(32 + pafSeq),
          reviewedAt: reviewedAt(33 + pafSeq),
          workflow: pafApprovedWorkflow(company),
          eeIdSap: `SAP-${20000 + seed}`,
        })
        authorizations.push(rejected, replacement)
        workingAuthorizations.push(rejected, replacement)
        createdPafNumbers += 2
        remaining -= 2
        continue
      }

      if (pattern === 4 || pattern === 5) {
        // Revision chain: same PAF number and same person; only details/duration change.
        const group = `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}`
        const pafNumber = allocatePafNumber()
        const person = candidateName(seed)
        const eeIdSap = seed % 3 === 0 ? `SAP-${21000 + seed}` : ''
        const rev1End = firstEnd
        const rev2End =
          pattern === 4 && addBiWeeks(range.startBiWeek, 16) <= range.lwp
            ? addBiWeeks(range.startBiWeek, 16)
            : firstEnd

        const rev1 = pafForPosition(position, {
          id: `${group}-r1`,
          revisionGroupId: group,
          revision: 1,
          isCurrentRevision: false,
          candidateName: person,
          pafNumber,
          eeIdSap,
          status: 'approved',
          startBiWeek: range.startBiWeek,
          lwp: rev1End,
          submittedAt: submittedAt(40 + pafSeq),
          reviewedAt: reviewedAt(41 + pafSeq),
          workflow: pafApprovedWorkflow(company),
        })
        const rev2 = pafForPosition(position, {
          id: `${group}-r2`,
          revisionGroupId: group,
          revision: 2,
          supersedesId: rev1.id,
          isCurrentRevision: pattern === 5,
          candidateName: person,
          pafNumber,
          eeIdSap,
          status: pattern === 5 ? 'pending' : 'approved',
          startBiWeek: range.startBiWeek,
          lwp: rev2End,
          submittedAt: submittedAt(42 + pafSeq),
          reviewedAt: pattern === 5 ? undefined : reviewedAt(43 + pafSeq),
          workflow: pattern === 5 ? pafPendingWorkflow(company) : pafApprovedWorkflow(company),
          totalHours: String(Number(position.totalHours) + 40),
          roster: pick(ROSTERS, seed + 1),
        })

        if (pattern === 4) {
          const rev3 = pafForPosition(position, {
            id: `${group}-r3`,
            revisionGroupId: group,
            revision: 3,
            supersedesId: rev2.id,
            isCurrentRevision: true,
            candidateName: person,
            pafNumber,
            eeIdSap,
            status: 'pending',
            startBiWeek: range.startBiWeek,
            lwp: rev2End,
            submittedAt: submittedAt(44 + pafSeq),
            workflow: pafPendingWorkflow(company),
            totalHours: String(Number(position.totalHours) + 80),
          })
          authorizations.push(rev1, rev2, rev3)
          workingAuthorizations.push(rev1, rev2, rev3)
        } else {
          authorizations.push(rev1, rev2)
          workingAuthorizations.push(rev1, rev2)
        }

        createdPafNumbers += 1
        remaining -= 1
        continue
      }

      // pattern 0: approved, pattern 1: pending — single person / single PAF number
      const status: ProjectAuthorizationRequest['status'] = pattern === 1 ? 'pending' : 'approved'
      const single = pafForPosition(position, {
        id: `${idPrefix}-paf-${company.toLowerCase()}-${pafSeq}-a`,
        candidateName: candidateName(seed),
        pafNumber: allocatePafNumber(),
        status,
        startBiWeek: range.startBiWeek,
        lwp: firstEnd,
        submittedAt: submittedAt(30 + pafSeq),
        reviewedAt: status === 'approved' ? reviewedAt(31 + pafSeq) : undefined,
        workflow: status === 'approved' ? pafApprovedWorkflow(company) : pafPendingWorkflow(company),
        eeIdSap: seed % 4 === 0 ? `SAP-${20000 + seed}` : '',
      })
      authorizations.push(single)
      workingAuthorizations.push(single)
      createdPafNumbers += 1
      remaining -= 1
    }
  })

  const combinedStaffing = [...existingStaffing, ...staffing]
  const combinedAuthorizations = [...existingAuthorizations, ...authorizations]
  assertPafNumberOwnsOnePerson(combinedAuthorizations)
  assertNoActivePafOverlaps(combinedStaffing, combinedAuthorizations)

  for (const request of authorizations) {
    if (!request.isCurrentRevision) continue
    if (!isActivePafStatus(request.status) && request.status !== 'rejected') {
      throw new Error(`Unexpected PAF status ${request.status} for ${request.id}`)
    }
  }

  return {
    staffing,
    authorizations,
    summary: {
      positionGroups,
      pafNumbers: createdPafNumbers,
      staffingRows: staffing.length,
      pafRows: authorizations.length,
    },
  }
}

/**
 * Persist generated sample data. Replace clears position/PAF stores first;
 * append merges with existing request data.
 */
export function applySampleDataLoad(options: ApplySampleDataOptions): GeneratedSampleData['summary'] {
  const existingStaffing = options.mode === 'append' ? readStoredStaffing() : []
  const existingAuthorizations = options.mode === 'append' ? readStoredAuthorizations() : []

  const generated = generateSampleData({
    recordCount: options.recordCount,
    positionRatio: options.positionRatio,
    existingStaffing,
    existingAuthorizations,
    idPrefix: `gen-${Date.now().toString(36)}`,
  })

  const staffing =
    options.mode === 'append' ? [...existingStaffing, ...generated.staffing] : generated.staffing
  const authorizations =
    options.mode === 'append'
      ? [...existingAuthorizations, ...generated.authorizations]
      : generated.authorizations

  assertPafNumberOwnsOnePerson(authorizations)
  assertNoActivePafOverlaps(staffing, authorizations)

  localStorage.setItem(STAFFING_STORAGE_KEY, JSON.stringify(staffing))
  localStorage.setItem(PAF_STORAGE_KEY, JSON.stringify(authorizations))
  markSeedCurrent()

  return generated.summary
}

const bootstrap = generateSampleData({
  recordCount: DEFAULT_BOOTSTRAP_RECORD_COUNT,
  positionRatio: DEFAULT_BOOTSTRAP_POSITION_RATIO,
  idPrefix: 'sample',
})

export const SAMPLE_STAFFING_PLAN_REQUESTS: StaffingPlanRequest[] = bootstrap.staffing
export const SAMPLE_PROJECT_AUTHORIZATION_REQUESTS: ProjectAuthorizationRequest[] =
  bootstrap.authorizations

export function seedSampleData() {
  localStorage.setItem(STAFFING_STORAGE_KEY, JSON.stringify(SAMPLE_STAFFING_PLAN_REQUESTS))
  localStorage.setItem(PAF_STORAGE_KEY, JSON.stringify(SAMPLE_PROJECT_AUTHORIZATION_REQUESTS))
  markSeedCurrent()
}
