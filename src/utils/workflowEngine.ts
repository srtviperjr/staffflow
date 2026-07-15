import type { RequestStatus } from '../types/staffingPlan'
import type {
  FieldCondition,
  WorkflowAction,
  WorkflowDefinition,
  WorkflowFormType,
  WorkflowNodeData,
  WorkflowProgress,
} from '../types/workflow'

type FormRecord = Record<string, unknown>

export interface WorkflowRunResult {
  progress: WorkflowProgress
  /** Derived request status from the current node's workflow state */
  status: RequestStatus
  stateId: string
  stateName: string
  /** True when the run finished at an end node */
  completed: boolean
  /** True when waiting for an approve/reject action */
  waiting: boolean
  currentNodeLabel: string
}

type StoredNode = WorkflowDefinition['nodes'][number]

function getNode(workflow: WorkflowDefinition, nodeId: string): StoredNode | undefined {
  return workflow.nodes.find((node) => node.id === nodeId)
}

function getOutgoing(
  workflow: WorkflowDefinition,
  sourceId: string,
  sourceHandle?: string | null,
) {
  return workflow.edges.filter((edge) => {
    if (edge.source !== sourceId) return false
    if (sourceHandle === undefined) return true
    return (edge.sourceHandle ?? null) === sourceHandle
  })
}

function followSingle(workflow: WorkflowDefinition, sourceId: string): string | null {
  const edges = getOutgoing(workflow, sourceId)
  if (edges.length === 0) return null
  // Prefer unlabeled / default handle when multiple edges exist
  const preferred =
    edges.find((edge) => !edge.sourceHandle || edge.sourceHandle === 'out') ?? edges[0]
  return preferred.target
}

function followBranch(
  workflow: WorkflowDefinition,
  sourceId: string,
  branch: 'yes' | 'no',
): string | null {
  const byHandle = getOutgoing(workflow, sourceId, branch)
  if (byHandle[0]) return byHandle[0].target

  const labeled = workflow.edges.find((edge) => {
    if (edge.source !== sourceId) return false
    const label = (edge.label || '').toLowerCase()
    if (branch === 'yes') return label === 'yes' || label === 'approve' || label === 'approved'
    return label === 'no' || label === 'reject' || label === 'rejected'
  })
  return labeled?.target ?? null
}

export function evaluateFieldCondition(
  formData: FormRecord,
  condition: FieldCondition | undefined,
): boolean {
  if (!condition?.field) return false

  const raw = formData[condition.field]
  const value = raw == null ? '' : String(raw).trim()
  const expected = (condition.value ?? '').trim()
  const operator = condition.operator || 'equals'

  switch (operator) {
    case 'isEmpty':
      return value.length === 0
    case 'isNotEmpty':
      return value.length > 0
    case 'contains':
      return value.toLowerCase().includes(expected.toLowerCase())
    case 'greaterThan': {
      const left = Number(value)
      const right = Number(expected)
      if (Number.isFinite(left) && Number.isFinite(right)) return left > right
      return value > expected
    }
    case 'lessThan': {
      const left = Number(value)
      const right = Number(expected)
      if (Number.isFinite(left) && Number.isFinite(right)) return left < right
      return value < expected
    }
    case 'notEquals':
      return value.toLowerCase() !== expected.toLowerCase()
    case 'equals':
    default:
      return value.toLowerCase() === expected.toLowerCase()
  }
}

export function mapStateToRequestStatus(
  workflow: WorkflowDefinition,
  stateId: string,
): RequestStatus {
  const state = workflow.states.find((item) => item.id === stateId)
  const name = (state?.name || '').toLowerCase()
  if (name.includes('reject')) return 'rejected'
  if (name.includes('approv') || name.includes('complete')) return 'approved'
  return 'pending'
}

function buildResult(
  workflow: WorkflowDefinition,
  progress: WorkflowProgress,
  node: StoredNode,
  completed: boolean,
  waiting: boolean,
): WorkflowRunResult {
  const stateId = node.data.stateId || ''
  const state = workflow.states.find((item) => item.id === stateId)
  return {
    progress,
    status: mapStateToRequestStatus(workflow, stateId),
    stateId,
    stateName: state?.name || '',
    completed,
    waiting,
    currentNodeLabel: node.data.label,
  }
}

function appendHistory(
  progress: WorkflowProgress,
  nodeId: string,
  branch?: 'yes' | 'no',
): WorkflowProgress {
  return {
    ...progress,
    currentNodeId: nodeId,
    history: [
      ...progress.history,
      {
        nodeId,
        arrivedAt: new Date().toISOString(),
        branch,
      },
    ],
  }
}

/**
 * Auto-advance from the current node until we hit a wait point or end.
 * When `action` is provided and the current node is waiting, apply approve/reject first.
 */
export function advanceWorkflow(
  workflow: WorkflowDefinition,
  progress: WorkflowProgress,
  formData: FormRecord,
  action?: WorkflowAction,
): WorkflowRunResult {
  let current = getNode(workflow, progress.currentNodeId)
  if (!current) {
    throw new Error(`Workflow node "${progress.currentNodeId}" not found`)
  }

  let nextProgress = progress
  let pendingAction = action
  let safety = 0

  while (safety < 50) {
    safety += 1
    current = getNode(workflow, nextProgress.currentNodeId)
    if (!current) break

    const kind = current.type
    const data = current.data

    if (kind === 'end') {
      return buildResult(workflow, nextProgress, current, true, false)
    }

    if (kind === 'decision') {
      const mode = data.decisionMode || 'manual'

      if (mode === 'field') {
        const yes = evaluateFieldCondition(formData, data.fieldCondition)
        const branch: 'yes' | 'no' = yes ? 'yes' : 'no'
        const target = followBranch(workflow, current.id, branch)
        if (!target) {
          return buildResult(workflow, nextProgress, current, true, false)
        }
        nextProgress = appendHistory({ ...nextProgress, currentNodeId: target }, target, branch)
        continue
      }

      // Manual decision
      if (pendingAction) {
        const branch: 'yes' | 'no' = pendingAction === 'approve' ? 'yes' : 'no'
        pendingAction = undefined
        const target = followBranch(workflow, current.id, branch)
        if (!target) {
          // If reject has no path, stay and mark rejected via state fallback
          if (branch === 'no') {
            return {
              ...buildResult(workflow, nextProgress, current, true, false),
              status: 'rejected',
            }
          }
          return buildResult(workflow, nextProgress, current, true, false)
        }
        nextProgress = appendHistory({ ...nextProgress, currentNodeId: target }, target, branch)
        continue
      }

      return buildResult(workflow, nextProgress, current, false, true)
    }

    if (kind === 'step' && data.waitForAction) {
      if (pendingAction) {
        const actionNow = pendingAction

        if (actionNow === 'reject') {
          // Prefer an explicit reject/no edge from this step; otherwise walk forward
          // to the next manual decision and take No there.
          const rejectTarget = followBranch(workflow, current.id, 'no')
          if (rejectTarget) {
            pendingAction = undefined
            nextProgress = appendHistory(
              { ...nextProgress, currentNodeId: rejectTarget },
              rejectTarget,
              'no',
            )
            continue
          }

          const forward = followSingle(workflow, current.id)
          if (forward) {
            // Keep reject action so a following manual decision can consume it
            nextProgress = appendHistory({ ...nextProgress, currentNodeId: forward }, forward)
            continue
          }

          return {
            ...buildResult(workflow, nextProgress, current, true, false),
            status: 'rejected',
          }
        }

        // approve → continue along the default edge; keep action for a following decision
        const target = followSingle(workflow, current.id)
        if (!target) {
          pendingAction = undefined
          return {
            ...buildResult(workflow, nextProgress, current, true, false),
            status: 'approved',
          }
        }
        nextProgress = appendHistory({ ...nextProgress, currentNodeId: target }, target, 'yes')
        continue
      }

      return buildResult(workflow, nextProgress, current, false, true)
    }

    // start, or automatic step — follow the single outgoing edge
    const target = followSingle(workflow, current.id)
    if (!target) {
      return buildResult(workflow, nextProgress, current, true, false)
    }
    nextProgress = appendHistory({ ...nextProgress, currentNodeId: target }, target)
  }

  current = getNode(workflow, nextProgress.currentNodeId)
  if (!current) {
    throw new Error('Workflow run lost current node')
  }
  return buildResult(workflow, nextProgress, current, false, true)
}

export function startWorkflow(
  workflow: WorkflowDefinition,
  formData: FormRecord,
): WorkflowRunResult {
  const startNode =
    workflow.nodes.find((node) => node.type === 'start') ?? workflow.nodes[0]
  if (!startNode) {
    throw new Error(`Workflow "${workflow.name}" has no start node`)
  }

  const progress: WorkflowProgress = {
    workflowId: workflow.id,
    currentNodeId: startNode.id,
    history: [
      {
        nodeId: startNode.id,
        arrivedAt: new Date().toISOString(),
      },
    ],
  }

  return advanceWorkflow(workflow, progress, formData)
}

export function getWorkflowForForm(
  workflows: WorkflowDefinition[],
  formType: WorkflowFormType,
): WorkflowDefinition | undefined {
  return workflows.find((workflow) => workflow.formType === formType)
}

export function describeDecision(data: WorkflowNodeData, _formType?: WorkflowFormType | null): string {
  if ((data.decisionMode || 'manual') === 'field' && data.fieldCondition?.field) {
    const { field, operator, value } = data.fieldCondition
    const needsValue = operator !== 'isEmpty' && operator !== 'isNotEmpty'
    return `If ${field} ${operator}${needsValue ? ` "${value}"` : ''}`
  }
  return data.decisionQuestion || data.label
}

/** Normalize legacy definitions missing formType / decision fields */
export function normalizeWorkflowDefinition(workflow: WorkflowDefinition): WorkflowDefinition {
  return {
    ...workflow,
    formType: workflow.formType ?? null,
    nodes: workflow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        waitForAction: node.data.waitForAction ?? false,
        decisionMode: node.data.decisionMode ?? (node.type === 'decision' ? 'manual' : undefined),
        fieldCondition: node.data.fieldCondition,
      },
    })),
  }
}
