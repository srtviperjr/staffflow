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

/** Runtime progress of a request through its workflow */
export interface WorkflowProgress {
  workflowId: string
  currentNodeId: string
  history: Array<{
    nodeId: string
    arrivedAt: string
    branch?: 'yes' | 'no'
  }>
}

export type WorkflowAction = 'approve' | 'reject'
