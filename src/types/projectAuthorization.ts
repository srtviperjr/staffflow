export type ProjectAuthorizationStatus = 'pending' | 'approved' | 'rejected'

export interface ProjectAuthorizationRequest {
  id: string
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
  hoursToGo: string
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
  hoursToGo: string
  roster: string
  startBiWeek: string
  lwp: string
}
