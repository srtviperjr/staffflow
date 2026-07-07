export const ROLES = [
  'Engineer',
  'Designer',
  'Architect',
  'Developer',
  'Support Technician',
] as const

export const DEPARTMENTS = [
  'Document Control',
  'Engineering',
  'Technical Support',
  'Project Controls',
  'Procurement',
  'Contract Formation',
  'Construction Management',
  'Commissioning',
] as const

export const APPLICATIONS = ['SPF', 'MS Office'] as const

export const ENGINEERING_TOOLS = [
  'AutoCad',
  'S3D',
  'Naviswork',
  'Revit',
  'Solidworks',
] as const

export const PROCUREMENT_TOOLS = ['Matman', 'SPMat'] as const

export type Role = (typeof ROLES)[number]
export type Department = (typeof DEPARTMENTS)[number]
export type Application = (typeof APPLICATIONS)[number]
export type EngineeringTool = (typeof ENGINEERING_TOOLS)[number]
export type ProcurementTool = (typeof PROCUREMENT_TOOLS)[number]
export type MachineSetup = 'Laptop' | 'Desktop'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalDetails {
  buddyName: string
  buddyEmail: string
  onboardingDate: string
  machineSetup: MachineSetup
  applications: Application[]
  engineeringTools: EngineeringTool[]
  procurementTools: ProcurementTool[]
}

export interface OnboardingRequest {
  id: string
  firstName: string
  lastName: string
  email: string
  requestingManagerName: string
  startDate: string
  role: Role
  department: Department
  status: RequestStatus
  submittedAt: string
  rejectionReason?: string
  approvalDetails?: ApprovalDetails
}

export interface RequestFormData {
  firstName: string
  lastName: string
  email: string
  requestingManagerName: string
  startDate: string
  role: Role | ''
  department: Department | ''
}

export interface ApprovalFormData {
  buddyName: string
  buddyEmail: string
  onboardingDate: string
  machineSetup: MachineSetup | ''
  applications: Application[]
  engineeringTools: EngineeringTool[]
  procurementTools: ProcurementTool[]
}
