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
  getActivePafsForPosition,
  isActivePafStatus,
} from '../utils/pafDateRules'
import { formatDateInput, parseDateInput } from '../utils/staffingPlanDates'
import { markSeedCurrent } from './seedVersion'

const STAFFING_STORAGE_KEY = 'staffing-plan-requests'
const PAF_STORAGE_KEY = 'project-authorization-requests'

/** Current staffing plan positions per company (plus extra revision rows). */
const RECORDS_PER_COMPANY = 45

const SUBMITTED_BASE = new Date('2026-06-01T09:00:00.000Z').getTime()
const POSITION_WINDOW_START = '2026-07-05' // bi-weekly Sunday
const POSITION_WINDOW_BIWEEKS = 26

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
    positionNumber: overrides.positionNumber ?? `${company.slice(0, 2).toUpperCase()}${String(index + 1).padStart(3, '0')}`,
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

function assertNoActivePafOverlaps(
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

function aStartsBeforePosition(
  request: ProjectAuthorizationRequest,
  position: StaffingPlanRequest,
) {
  const start = parseDateInput(request.startBiWeek)
  const available = parseDateInput(position.startBiWeek)
  if (!start || !available) return true
  return start.getTime() < available.getTime()
}

function generateSampleData(): {
  staffing: StaffingPlanRequest[]
  authorizations: ProjectAuthorizationRequest[]
} {
  const staffing: StaffingPlanRequest[] = []
  const authorizations: ProjectAuthorizationRequest[] = []
  let pafCounter = 1

  const nextPafNumber = () => `PAF${String(pafCounter++).padStart(5, '0')}`

  for (const company of COMPANIES) {
    for (let index = 0; index < RECORDS_PER_COMPANY; index += 1) {
      const groupId = `sample-sp-${company.toLowerCase()}-${String(index + 1).padStart(2, '0')}`
      const statusRoll = index % 10
      const status: StaffingPlanRequest['status'] =
        statusRoll === 8 ? 'pending' : statusRoll === 9 ? 'rejected' : 'approved'

      const hasStaffingRevision = status === 'approved' && index % 9 === 0
      const startBiWeek = addBiWeeks(POSITION_WINDOW_START, index % 3)
      const lwp = addBiWeeks(startBiWeek, POSITION_WINDOW_BIWEEKS)

      if (hasStaffingRevision) {
        staffing.push(
          buildStaffingPosition(company, index, {
            id: `${groupId}-r1`,
            revisionGroupId: groupId,
            revision: 1,
            isCurrentRevision: false,
            status: 'approved',
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
            status: 'approved',
            startBiWeek,
            lwp,
            submittedAt: submittedAt(index + 2),
            reviewedAt: reviewedAt(index + 3),
            workflow: staffingApprovedWorkflow(company),
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
            startBiWeek,
            lwp,
            submittedAt: submittedAt(index),
            reviewedAt:
              status === 'pending' ? undefined : reviewedAt(index + 1),
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

      const currentPosition = staffing.find(
        (request) => request.revisionGroupId === groupId && request.isCurrentRevision,
      )
      if (!currentPosition || currentPosition.status !== 'approved') continue

      const pattern = index % 7
      const midEnd = addBiWeeks(currentPosition.startBiWeek, 12)
      const secondStart = addBiWeeks(midEnd, 1)
      const seed = COMPANIES.indexOf(company) * 100 + index

      if (pattern === 5) {
        // Leave position open for new PAF creation demos.
        continue
      }

      if (pattern === 0) {
        // Single approved PAF covering first half of the window.
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-a`,
            candidateName: candidateName(seed),
            pafNumber: nextPafNumber(),
            status: 'approved',
            startBiWeek: currentPosition.startBiWeek,
            lwp: midEnd,
            submittedAt: submittedAt(30 + index),
            reviewedAt: reviewedAt(31 + index),
            workflow: pafApprovedWorkflow(company),
            eeIdSap: index % 4 === 0 ? `SAP-${20000 + seed}` : '',
          }),
        )
        continue
      }

      if (pattern === 1) {
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-a`,
            candidateName: candidateName(seed),
            pafNumber: nextPafNumber(),
            status: 'pending',
            startBiWeek: currentPosition.startBiWeek,
            lwp: midEnd,
            submittedAt: submittedAt(32 + index),
            workflow: pafPendingWorkflow(company),
          }),
        )
        continue
      }

      if (pattern === 2) {
        // Rejected candidate replaced by a later approved PAF on the same window.
        // Rejected PAFs do not occupy the position, so dates may match the replacement.
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-a`,
            candidateName: candidateName(seed),
            pafNumber: nextPafNumber(),
            status: 'rejected',
            startBiWeek: currentPosition.startBiWeek,
            lwp: midEnd,
            submittedAt: submittedAt(33 + index),
            reviewedAt: reviewedAt(34 + index),
            rejectionComment: 'Candidate does not meet minimum experience requirements.',
            workflow: pafRejectedWorkflow(company),
          }),
        )
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-b`,
            candidateName: candidateName(seed + 11),
            pafNumber: nextPafNumber(),
            status: 'approved',
            startBiWeek: currentPosition.startBiWeek,
            lwp: midEnd,
            submittedAt: submittedAt(35 + index),
            reviewedAt: reviewedAt(36 + index),
            workflow: pafApprovedWorkflow(company),
          }),
        )
        continue
      }

      if (pattern === 3) {
        // Two sequential active PAFs — abutting, non-overlapping.
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-a`,
            candidateName: candidateName(seed),
            pafNumber: nextPafNumber(),
            status: 'approved',
            startBiWeek: currentPosition.startBiWeek,
            lwp: midEnd,
            submittedAt: submittedAt(37 + index),
            reviewedAt: reviewedAt(38 + index),
            workflow: pafApprovedWorkflow(company),
          }),
        )
        authorizations.push(
          pafForPosition(currentPosition, {
            id: `sample-paf-${company.toLowerCase()}-${index + 1}-b`,
            candidateName: candidateName(seed + 17),
            pafNumber: nextPafNumber(),
            status: 'approved',
            startBiWeek: secondStart,
            lwp: currentPosition.lwp,
            submittedAt: submittedAt(39 + index),
            reviewedAt: reviewedAt(40 + index),
            workflow: pafApprovedWorkflow(company),
          }),
        )
        continue
      }

      if (pattern === 4) {
        // Three-revision chain on the same date window (only latest is current/active).
        const group = `sample-paf-${company.toLowerCase()}-${index + 1}`
        const pafNumber = nextPafNumber()
        const rev1 = pafForPosition(currentPosition, {
          id: `${group}-r1`,
          revisionGroupId: group,
          revision: 1,
          isCurrentRevision: false,
          candidateName: candidateName(seed),
          pafNumber,
          status: 'approved',
          startBiWeek: currentPosition.startBiWeek,
          lwp: midEnd,
          submittedAt: submittedAt(41 + index),
          reviewedAt: reviewedAt(42 + index),
          workflow: pafApprovedWorkflow(company),
        })
        const rev2 = pafForPosition(currentPosition, {
          id: `${group}-r2`,
          revisionGroupId: group,
          revision: 2,
          supersedesId: rev1.id,
          isCurrentRevision: false,
          candidateName: candidateName(seed + 1),
          pafNumber,
          status: 'approved',
          startBiWeek: currentPosition.startBiWeek,
          lwp: midEnd,
          submittedAt: submittedAt(43 + index),
          reviewedAt: reviewedAt(44 + index),
          workflow: pafApprovedWorkflow(company),
          totalHours: String(Number(currentPosition.totalHours) + 40),
        })
        const rev3 = pafForPosition(currentPosition, {
          id: `${group}-r3`,
          revisionGroupId: group,
          revision: 3,
          supersedesId: rev2.id,
          isCurrentRevision: true,
          candidateName: candidateName(seed + 2),
          pafNumber,
          status: 'pending',
          startBiWeek: currentPosition.startBiWeek,
          lwp: midEnd,
          submittedAt: submittedAt(45 + index),
          workflow: pafPendingWorkflow(company),
          totalHours: String(Number(currentPosition.totalHours) + 80),
        })
        authorizations.push(rev1, rev2, rev3)
        continue
      }

      // pattern 6: approved then revised to pending current
      {
        const group = `sample-paf-${company.toLowerCase()}-${index + 1}`
        const pafNumber = nextPafNumber()
        const rev1 = pafForPosition(currentPosition, {
          id: `${group}-r1`,
          revisionGroupId: group,
          revision: 1,
          isCurrentRevision: false,
          candidateName: candidateName(seed),
          pafNumber,
          status: 'approved',
          startBiWeek: secondStart,
          lwp: currentPosition.lwp,
          submittedAt: submittedAt(46 + index),
          reviewedAt: reviewedAt(47 + index),
          workflow: pafApprovedWorkflow(company),
        })
        const rev2 = pafForPosition(currentPosition, {
          id: `${group}-r2`,
          revisionGroupId: group,
          revision: 2,
          supersedesId: rev1.id,
          isCurrentRevision: true,
          candidateName: candidateName(seed + 5),
          pafNumber,
          status: 'pending',
          startBiWeek: secondStart,
          lwp: currentPosition.lwp,
          submittedAt: submittedAt(48 + index),
          workflow: pafPendingWorkflow(company),
        })
        authorizations.push(rev1, rev2)
      }
    }
  }

  assertNoActivePafOverlaps(staffing, authorizations)

  // Soft sanity: every active PAF must use isActive status correctly in assert above.
  for (const request of authorizations) {
    if (!request.isCurrentRevision) continue
    if (!isActivePafStatus(request.status) && request.status !== 'rejected') {
      throw new Error(`Unexpected PAF status ${request.status} for ${request.id}`)
    }
  }

  return { staffing, authorizations }
}

const generated = generateSampleData()

export const SAMPLE_STAFFING_PLAN_REQUESTS: StaffingPlanRequest[] = generated.staffing
export const SAMPLE_PROJECT_AUTHORIZATION_REQUESTS: ProjectAuthorizationRequest[] =
  generated.authorizations

export function seedSampleData() {
  localStorage.setItem(STAFFING_STORAGE_KEY, JSON.stringify(SAMPLE_STAFFING_PLAN_REQUESTS))
  localStorage.setItem(PAF_STORAGE_KEY, JSON.stringify(SAMPLE_PROJECT_AUTHORIZATION_REQUESTS))
  markSeedCurrent()
}
