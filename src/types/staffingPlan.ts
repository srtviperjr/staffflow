import type { Company } from '../constants/companies'
import {
  AREAS,
  CLASSES,
  COUNTRIES,
  DISCIPLINES,
  DSG_OPTIONS,
  FUNCTIONAL_GROUPS,
  LOCATION_TYPES,
  PHASES,
  POSITIONS,
  ROSTERS,
  SUB_AREAS,
  sortAlpha,
} from '../constants/staffingPlanOptions'
import type { WorkflowProgress } from './workflow'

export type Phase = (typeof PHASES)[number]
export type LocationType = (typeof LOCATION_TYPES)[number]
export type FunctionalGroup = (typeof FUNCTIONAL_GROUPS)[number]
export type Dsg = (typeof DSG_OPTIONS)[number]
export type Area = (typeof AREAS)[number]
export type SubArea = (typeof SUB_AREAS)[number]
export type Discipline = (typeof DISCIPLINES)[number]
export type PositionClass = (typeof CLASSES)[number]
export type Roster = (typeof ROSTERS)[number]
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface StaffingPlanRequest {
  id: string
  revisionGroupId: string
  revision: number
  supersedesId?: string
  isCurrentRevision: boolean
  positionNumber: string
  phase: Phase
  locationType: LocationType
  functionalGroup: FunctionalGroup
  dsg: string
  area: Area
  subArea: SubArea
  country: string
  discipline: Discipline
  position: string
  class: PositionClass
  company: Company
  eeIdSap: string
  sortNumber: string
  totalHours: string
  hoursToGo: string
  /** Hourly cost rate for the position (currency units per hour). */
  hourlyCost: string
  roster: Roster
  startBiWeek: string
  lwp: string
  status: RequestStatus
  submittedAt: string
  rejectionComment?: string
  reviewedAt?: string
  /** Progress through the staffing-plan workflow definition, when attached */
  workflow?: WorkflowProgress
}

export interface StaffingPlanFormData {
  phase: Phase | ''
  locationType: LocationType | ''
  functionalGroup: FunctionalGroup | ''
  dsg: string
  area: Area | ''
  subArea: SubArea | ''
  country: string
  discipline: Discipline | ''
  position: string
  class: PositionClass | ''
  company: Company | ''
  eeIdSap: string
  sortNumber: string
  totalHours: string
  hoursToGo: string
  hourlyCost: string
  roster: Roster | ''
  startBiWeek: string
  lwp: string
}

export const COUNTRY_SUGGESTIONS = sortAlpha(COUNTRIES)
export const POSITION_SUGGESTIONS = sortAlpha(POSITIONS)
