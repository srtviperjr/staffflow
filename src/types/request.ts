export type Project = 'JS1' | 'JS2'
export type Organization = 'BHP' | 'HBJV'
export type RoleType = 'New' | 'Existing'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface LabourChangeRequest {
  id: string
  requesterName: string
  email: string
  isUrgent: boolean
  project: Project
  areaFunctionDiscipline: string
  endorsingHeadName: string
  organization: Organization
  changeReason: string
  roleType: RoleType
  status: RequestStatus
  submittedAt: string
  rejectionComment?: string
  reviewedAt?: string
}

export interface RequestFormData {
  requesterName: string
  email: string
  isUrgent: '' | 'yes' | 'no'
  project: Project | ''
  areaFunctionDiscipline: string
  endorsingHeadName: string
  organization: Organization | ''
  changeReason: string
  roleType: RoleType | ''
}
