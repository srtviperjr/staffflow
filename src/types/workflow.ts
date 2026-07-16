export type WorkflowNodeKind = 'start' | 'step' | 'decision' | 'end'

/** Forms that can have an attached approval workflow */
export type WorkflowFormType = 'staffing-plan' | 'project-authorization'

export type DecisionMode = 'manual' | 'field'

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty'
  /** True when the field value differs from the previous revision (revise only). */
  | 'hasChanged'
  /** True when the field value matches the previous revision, or there is no previous. */
  | 'hasNotChanged'

export interface FieldCondition {
  field: string
  operator: ConditionOperator
  value: string
}

export interface WorkflowState {
  id: string
  name: string
  color: string
}

export interface WorkflowNodeData {
  label: string
  kind: WorkflowNodeKind
  /** Role responsible for this step or decision */
  roleId: string
  /** Item state applied when this node is reached */
  stateId: string
  /** Decision prompt shown on diamond nodes */
  decisionQuestion?: string
  /**
   * When true on a step, the request pauses here until a manager
   * approves or rejects (approve continues; reject seeks a reject path).
   */
  waitForAction?: boolean
  /** How a decision node chooses Yes vs No */
  decisionMode?: DecisionMode
  /** When decisionMode is 'field', evaluate against the bound form */
  fieldCondition?: FieldCondition
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  /** Form this workflow drives at runtime; null = design-only */
  formType: WorkflowFormType | null
  states: WorkflowState[]
  nodes: Array<{
    id: string
    type: WorkflowNodeKind
    position: { x: number; y: number }
    data: WorkflowNodeData
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string | null
    targetHandle?: string | null
    label?: string
  }>
  updatedAt: string
}

export interface WorkflowNodeUpdate {
  label?: string
  roleId?: string
  stateId?: string
  decisionQuestion?: string
  waitForAction?: boolean
  decisionMode?: DecisionMode
  fieldCondition?: FieldCondition
}

/** User credited when submitting or acting on a workflow step */
export interface WorkflowActor {
  userId: string
  name: string
}

export interface WorkflowHistoryEntry {
  nodeId: string
  arrivedAt: string
  branch?: 'yes' | 'no'
  /** When a user completed this step (submit / approve / reject) */
  actedAt?: string
  actedByUserId?: string
  actedByName?: string
  action?: 'approve' | 'reject' | 'submit'
}

/** Runtime progress of a request through its workflow */
export interface WorkflowProgress {
  workflowId: string
  currentNodeId: string
  history: WorkflowHistoryEntry[]
  /**
   * Form snapshot from the prior revision when this run started via revise.
   * Used by hasChanged / hasNotChanged field decisions throughout the run.
   */
  previousFormData?: Record<string, unknown>
}

export type WorkflowAction = 'approve' | 'reject'
