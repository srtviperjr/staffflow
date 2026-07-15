import {
  AREAS,
  CLASSES,
  DISCIPLINES,
  DSG_OPTIONS,
  FUNCTIONAL_GROUPS,
  HIRING_SOURCES,
  LOCATION_TYPES,
  PHASES,
  ROSTERS,
  SUB_AREAS,
} from './staffingPlanOptions'
import type { WorkflowFormType } from '../types/workflow'

export interface WorkflowFormField {
  key: string
  label: string
  /** Optional closed list for condition value pickers */
  options?: readonly string[]
}

export interface WorkflowFormMeta {
  type: WorkflowFormType
  label: string
  description: string
  fields: WorkflowFormField[]
}

export const WORKFLOW_FORMS: WorkflowFormMeta[] = [
  {
    type: 'staffing-plan',
    label: 'Staffing Plan',
    description: 'Position requests submitted for manager approval',
    fields: [
      { key: 'phase', label: 'Phase', options: PHASES },
      { key: 'locationType', label: 'Location Type', options: LOCATION_TYPES },
      { key: 'functionalGroup', label: 'Functional Group', options: FUNCTIONAL_GROUPS },
      { key: 'dsg', label: 'DSG', options: DSG_OPTIONS },
      { key: 'area', label: 'Area', options: AREAS },
      { key: 'subArea', label: 'Sub Area', options: SUB_AREAS },
      { key: 'country', label: 'Country' },
      { key: 'discipline', label: 'Discipline', options: DISCIPLINES },
      { key: 'position', label: 'Position' },
      { key: 'class', label: 'Class', options: CLASSES },
      { key: 'hiringSource', label: 'Hiring Source', options: HIRING_SOURCES },
      { key: 'eeIdSap', label: 'EE Id / SAP' },
      { key: 'sortNumber', label: 'Sort Number' },
      { key: 'totalHours', label: 'Total Hours' },
      { key: 'hoursToGo', label: 'Hours To Go' },
      { key: 'roster', label: 'Roster', options: ROSTERS },
      { key: 'startBiWeek', label: 'Start Bi-Week' },
      { key: 'lwp', label: 'LWP' },
    ],
  },
  {
    type: 'project-authorization',
    label: 'PAF (Project Authorization)',
    description: 'Candidate authorization against an approved staffing position',
    fields: [
      { key: 'functionalGroup', label: 'Functional Group', options: FUNCTIONAL_GROUPS },
      { key: 'dsg', label: 'DSG', options: DSG_OPTIONS },
      { key: 'candidateName', label: 'Candidate Name' },
      { key: 'country', label: 'Country' },
      { key: 'class', label: 'Class', options: CLASSES },
      { key: 'hiringSource', label: 'Hiring Source', options: HIRING_SOURCES },
      { key: 'eeIdSap', label: 'EE Id / SAP' },
      { key: 'sortNumber', label: 'Sort Number' },
      { key: 'totalHours', label: 'Total Hours' },
      { key: 'roster', label: 'Roster', options: ROSTERS },
      { key: 'startBiWeek', label: 'Start Bi-Week' },
      { key: 'lwp', label: 'LWP' },
      { key: 'position', label: 'Position' },
      { key: 'approvedPositionLabel', label: 'Approved Position Label' },
    ],
  },
]

export const CONDITION_OPERATORS: Array<{ value: import('../types/workflow').ConditionOperator; label: string }> =
  [
    { value: 'equals', label: 'equals' },
    { value: 'notEquals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'greaterThan', label: 'is greater than' },
    { value: 'lessThan', label: 'is less than' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
  ]

export function getWorkflowFormMeta(formType: WorkflowFormType | null | undefined) {
  if (!formType) return undefined
  return WORKFLOW_FORMS.find((form) => form.type === formType)
}

export function getFormFieldLabel(formType: WorkflowFormType | null | undefined, fieldKey: string) {
  const field = getWorkflowFormMeta(formType)?.fields.find((item) => item.key === fieldKey)
  return field?.label ?? fieldKey
}
