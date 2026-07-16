import type { Company } from '../constants/companies'
import type { WorkflowProgress } from './workflow'

export type ProjectAuthorizationStatus = 'pending' | 'approved' | 'rejected'

export interface ProjectAuthorizationRequest {
  id: string
  revisionGroupId: string
  revision: number
  supersedesId?: string
  isCurrentRevision: boolean
  staffingPlanRequestId: string
  functionalGroup: string
  dsg: string
  approvedPositionLabel: string
  position: string
  candidateName: string
  country: string
  class: string
  hiringSource: string
  company: Company
  eeIdSap: string
  pafNumber: string
  sortNumber: string
  totalHours: string
  roster: string
  startBiWeek: string
  lwp: string
  status: ProjectAuthorizationStatus
  submittedAt: string
  rejectionComment?: string
  reviewedAt?: string
  /** Progress through the PAF workflow definition, when attached */
  workflow?: WorkflowProgress
}

export interface ProjectAuthorizationFormData {
  staffingPlanRequestId: string
  functionalGroup: string
  dsg: string
  candidateName: string
  country: string
  class: string
  hiringSource: string
  company: Company | ''
  eeIdSap: string
  sortNumber: string
  totalHours: string
  roster: string
  startBiWeek: string
  lwp: string
}
