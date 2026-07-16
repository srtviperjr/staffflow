import type { Company } from '../constants/companies'
import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import type { WorkflowProgress } from '../types/workflow'
import { formatApprovedPositionLabel } from '../utils/approvedPositions'
import { markSeedCurrent } from './seedVersion'

const STAFFING_STORAGE_KEY = 'staffing-plan-requests'
const PAF_STORAGE_KEY = 'project-authorization-requests'

const SUBMITTED_BASE = new Date('2026-06-01T09:00:00.000Z').getTime()

function submittedAt(offsetDays: number) {
  return new Date(SUBMITTED_BASE + offsetDays * 86_400_000).toISOString()
}

function reviewedAt(offsetDays: number) {
  return new Date(SUBMITTED_BASE + offsetDays * 86_400_000 + 3_600_000).toISOString()
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
  const reviewNode =
    company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
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
  const reviewNode =
    company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
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
  const reviewNode =
    company === 'Fluor' ? 'paf-review-contractor' : 'paf-review-standard'
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

export const SAMPLE_STAFFING_PLAN_REQUESTS: StaffingPlanRequest[] = [
  {
    id: 'sample-sp-01',
    revisionGroupId: 'sample-sp-01',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE01',
    phase: 'JS1',
    locationType: 'Project Office',
    functionalGroup: 'Engineering',
    dsg: '290 - Architecture',
    area: 'FE',
    subArea: 'DV',
    country: 'Canada',
    discipline: '29 - Architecture',
    position: 'Architect',
    class: 'E00 - Principal',
    company: 'Bantrel',
    eeIdSap: '',
    sortNumber: '101',
    totalHours: '2080',
    hoursToGo: '1040',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'approved',
    submittedAt: submittedAt(0),
    reviewedAt: reviewedAt(1),
    workflow: staffingApprovedWorkflow('Bantrel'),
  },
  {
    id: 'sample-sp-02',
    revisionGroupId: 'sample-sp-02',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE02',
    phase: 'JS1',
    locationType: 'Site - Comm',
    functionalGroup: 'Engineering',
    dsg: '260 - Electrical Engineering',
    area: 'Process',
    subArea: 'SS',
    country: 'Chile',
    discipline: '26 - Electrical Engineering',
    position: 'Engineer',
    class: 'E10 - Engineer',
    company: 'Hatch',
    eeIdSap: '',
    sortNumber: '102',
    totalHours: '1800',
    hoursToGo: '900',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'approved',
    submittedAt: submittedAt(1),
    reviewedAt: reviewedAt(2),
    workflow: staffingApprovedWorkflow('Hatch'),
  },
  {
    id: 'sample-sp-03',
    revisionGroupId: 'sample-sp-03',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE03',
    phase: 'JS2',
    locationType: 'Site - Const',
    functionalGroup: 'Engineering',
    dsg: '270 - Systems and Process Control Engineering',
    area: 'NPI',
    subArea: 'UG',
    country: 'South Africa',
    discipline: '27 - Systems and Process Control',
    position: 'PCS Lead',
    class: 'E09 - Senior Engineer',
    company: 'Fluor',
    eeIdSap: '',
    sortNumber: '103',
    totalHours: '2200',
    hoursToGo: '1100',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-06-21',
    lwp: '2026-12-27',
    status: 'approved',
    submittedAt: submittedAt(2),
    reviewedAt: reviewedAt(3),
    workflow: staffingApprovedWorkflow('Fluor'),
  },
  {
    id: 'sample-sp-04',
    revisionGroupId: 'sample-sp-04',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE04',
    phase: 'JS1',
    locationType: 'Project Office',
    functionalGroup: 'Project Controls',
    dsg: '610 - Planning and Scheduling',
    area: 'Central Functions',
    subArea: 'DV',
    country: 'Canada',
    discipline: '61 - Planning and Scheduling',
    position: 'Senior Planner',
    class: 'E09 - Senior Engineer',
    company: 'BHP',
    eeIdSap: '',
    sortNumber: '104',
    totalHours: '1900',
    hoursToGo: '950',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'approved',
    submittedAt: submittedAt(3),
    reviewedAt: reviewedAt(4),
    workflow: staffingApprovedWorkflow('Hatch'),
  },
  {
    id: 'sample-sp-05',
    revisionGroupId: 'sample-sp-05',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE05',
    phase: 'JS1',
    locationType: 'Site - Comm',
    functionalGroup: 'Construction Management',
    dsg: '400 - Site Management, Construction Management, Construction Coordination',
    area: 'Mining',
    subArea: 'UG',
    country: 'Canada',
    discipline: '40 - Construction Management',
    position: 'Package Coordinator',
    class: 'E02 - Engineering, Project, Construction Manager',
    company: 'Bantrel',
    eeIdSap: '',
    sortNumber: '105',
    totalHours: '2000',
    hoursToGo: '1000',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-06-21',
    lwp: '2026-12-27',
    status: 'pending',
    submittedAt: submittedAt(4),
    workflow: staffingPendingWorkflow('Bantrel'),
  },
  {
    id: 'sample-sp-06',
    revisionGroupId: 'sample-sp-06',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE06',
    phase: 'JS1',
    locationType: 'Project Office',
    functionalGroup: 'Contracts & Procurement',
    dsg: '330 - Expediting',
    area: 'General',
    subArea: 'SS',
    country: 'India',
    discipline: '33 - Expediting',
    position: 'Expeditor - offsite',
    class: 'X42 - Project Support Coordinator - India',
    company: 'Hatch',
    eeIdSap: 'SAP-88421',
    sortNumber: '106',
    totalHours: '1760',
    hoursToGo: '880',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'pending',
    submittedAt: submittedAt(5),
    workflow: staffingPendingWorkflow('Hatch'),
  },
  {
    id: 'sample-sp-07',
    revisionGroupId: 'sample-sp-07',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE07',
    phase: 'JS2',
    locationType: 'Site - Const',
    functionalGroup: 'Project Management',
    dsg: '140 - Risk Management',
    area: 'Mining',
    subArea: 'UG',
    country: 'South Africa',
    discipline: '14 - Risk Management',
    position: 'Site Risk Specialist Mining',
    class: 'E04 - Specialist/Supervisor',
    company: 'Fluor',
    eeIdSap: '',
    sortNumber: '107',
    totalHours: '1920',
    hoursToGo: '960',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'pending',
    submittedAt: submittedAt(6),
    workflow: staffingPendingWorkflow('Fluor'),
  },
  {
    id: 'sample-sp-08',
    revisionGroupId: 'sample-sp-08',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE08',
    phase: 'JS1',
    locationType: 'Project Office',
    functionalGroup: 'Project Controls',
    dsg: '630 - Cost Management',
    area: 'Central Functions',
    subArea: 'Wet Mill',
    country: 'Chile',
    discipline: '63 - Cost Management',
    position: 'Cost Controller - Lead',
    class: 'E02 - Engineering, Project, Construction Manager',
    company: 'BHP',
    eeIdSap: '',
    sortNumber: '108',
    totalHours: '1840',
    hoursToGo: '920',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-06-21',
    lwp: '2026-12-27',
    status: 'pending',
    submittedAt: submittedAt(7),
    workflow: staffingPendingWorkflow('Hatch'),
  },
  {
    id: 'sample-sp-09',
    revisionGroupId: 'sample-sp-09',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE09',
    phase: 'JS1',
    locationType: 'Project Office',
    functionalGroup: 'Contracts & Procurement',
    dsg: '321 - Purchasing Formation',
    area: 'IPT',
    subArea: 'DV',
    country: 'Canada',
    discipline: '32 - Purchasing',
    position: 'Purchasing Agent',
    class: 'E25 - Administrative Specialist',
    company: 'Hatch',
    eeIdSap: '',
    sortNumber: '109',
    totalHours: '1560',
    hoursToGo: '780',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-07-05',
    lwp: '2027-01-03',
    status: 'rejected',
    submittedAt: submittedAt(8),
    reviewedAt: reviewedAt(9),
    rejectionComment: 'Position budget not approved for this phase.',
    workflow: staffingRejectedWorkflow('Hatch'),
  },
  {
    id: 'sample-sp-10',
    revisionGroupId: 'sample-sp-10',
    revision: 1,
    isCurrentRevision: true,
    positionNumber: 'SAMPLE10',
    phase: 'JS2',
    locationType: 'Site - Comm',
    functionalGroup: 'Commissioning',
    dsg: '500 - Commissioning Management',
    area: 'NPI',
    subArea: 'SS',
    country: 'USA',
    discipline: '50 - Commissioning Management',
    position: 'I&C Lead NPI Area',
    class: 'E09 - Senior Engineer',
    company: 'Fluor',
    eeIdSap: '',
    sortNumber: '110',
    totalHours: '2100',
    hoursToGo: '1050',
    roster: '5x2 (10 hrs)',
    startBiWeek: '2026-06-21',
    lwp: '2026-12-27',
    status: 'rejected',
    submittedAt: submittedAt(9),
    reviewedAt: reviewedAt(10),
    rejectionComment: 'Duplicate role — existing commissioning lead covers this area.',
    workflow: staffingRejectedWorkflow('Fluor'),
  },
]

function pafForPosition(
  position: StaffingPlanRequest,
  overrides: Partial<ProjectAuthorizationRequest> & {
    id: string
    candidateName: string
    pafNumber: string
    status: ProjectAuthorizationRequest['status']
    company?: Company
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
    startBiWeek: overrides.startBiWeek ?? position.startBiWeek,
    lwp: overrides.lwp ?? position.lwp,
    status: overrides.status,
    submittedAt: overrides.submittedAt ?? submittedAt(12),
    reviewedAt: overrides.reviewedAt,
    rejectionComment: overrides.rejectionComment,
    workflow: overrides.workflow,
  }
}

/** One active (pending/approved current) PAF per staffing position — no overlaps. */
export const SAMPLE_PROJECT_AUTHORIZATION_REQUESTS: ProjectAuthorizationRequest[] = [
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[0], {
    id: 'sample-paf-01',
    candidateName: 'Jane Smith',
    pafNumber: 'PAF00001',
    status: 'approved',
    company: 'Bantrel',
    submittedAt: submittedAt(11),
    reviewedAt: reviewedAt(12),
    workflow: pafApprovedWorkflow('Bantrel'),
  }),
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[1], {
    id: 'sample-paf-02',
    candidateName: 'Priya Sharma',
    pafNumber: 'PAF00002',
    status: 'pending',
    company: 'Hatch',
    country: 'India',
    submittedAt: submittedAt(12),
    workflow: pafPendingWorkflow('Hatch'),
  }),
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[2], {
    id: 'sample-paf-03',
    candidateName: 'Tom Wilson',
    pafNumber: 'PAF00003',
    status: 'rejected',
    company: 'Fluor',
    submittedAt: submittedAt(13),
    reviewedAt: reviewedAt(14),
    rejectionComment: 'Candidate does not meet minimum experience requirements.',
    workflow: pafRejectedWorkflow('Fluor'),
  }),
  // Superseded approved revision — Noah (below) is the current active PAF on this position.
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[3], {
    id: 'sample-paf-04',
    candidateName: 'Carlos Mendez',
    pafNumber: 'PAF00004',
    status: 'approved',
    company: 'BHP',
    eeIdSap: 'SAP-99102',
    submittedAt: submittedAt(14),
    reviewedAt: reviewedAt(15),
    isCurrentRevision: false,
    workflow: pafApprovedWorkflow('Hatch'),
  }),
  // New PAF on sp-03 after Tom was rejected — position is free once rejected.
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[2], {
    id: 'sample-paf-05',
    candidateName: 'Elena Vasquez',
    pafNumber: 'PAF00005',
    status: 'approved',
    company: 'Fluor',
    submittedAt: submittedAt(15),
    reviewedAt: reviewedAt(16),
    workflow: pafApprovedWorkflow('Fluor'),
  }),
  // Revision of Carlos's PAF group — same position, same PAF number, only this revision is current.
  pafForPosition(SAMPLE_STAFFING_PLAN_REQUESTS[3], {
    id: 'sample-paf-06',
    revisionGroupId: 'sample-paf-04',
    revision: 2,
    supersedesId: 'sample-paf-04',
    candidateName: 'Noah Berger',
    pafNumber: 'PAF00004',
    status: 'pending',
    company: 'BHP',
    submittedAt: submittedAt(16),
    workflow: pafPendingWorkflow('Hatch'),
  }),
]

export function seedSampleData() {
  localStorage.setItem(STAFFING_STORAGE_KEY, JSON.stringify(SAMPLE_STAFFING_PLAN_REQUESTS))
  localStorage.setItem(PAF_STORAGE_KEY, JSON.stringify(SAMPLE_PROJECT_AUTHORIZATION_REQUESTS))
  markSeedCurrent()
}
