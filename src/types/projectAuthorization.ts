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
  eeIdSap: string
  sortNumber: string
  totalHours: string
  roster: string
  startBiWeek: string
  lwp: string
  status: ProjectAuthorizationStatus
  submittedAt: string
  rejectionComment?: string
  reviewedAt?: string
}

export interface ProjectAuthorizationFormData {
  staffingPlanRequestId: string
  functionalGroup: string
  dsg: string
  candidateName: string
  country: string
  class: string
  hiringSource: string
  eeIdSap: string
  sortNumber: string
  totalHours: string
  roster: string
  startBiWeek: string
  lwp: string
}
