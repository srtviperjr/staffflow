export type WorkflowNodeKind = 'start' | 'step' | 'decision' | 'end'

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
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
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
}
