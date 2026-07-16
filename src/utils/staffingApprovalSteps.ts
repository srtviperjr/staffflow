import type { Phase } from '../types/staffingPlan'
import type { WorkflowDefinition, WorkflowProgress } from '../types/workflow'

export type ApprovalStepStatus = 'done' | 'current' | 'upcoming' | 'rejected'

export interface StaffingApprovalStep {
  nodeId: string
  label: string
  roleId: string
  status: ApprovalStepStatus
}

type StoredNode = WorkflowDefinition['nodes'][number]

function getNode(workflow: WorkflowDefinition, nodeId: string): StoredNode | undefined {
  return workflow.nodes.find((node) => node.id === nodeId)
}

function followSingle(workflow: WorkflowDefinition, sourceId: string): string | null {
  const edges = workflow.edges.filter((edge) => edge.source === sourceId)
  if (edges.length === 0) return null
  const preferred =
    edges.find((edge) => !edge.sourceHandle || edge.sourceHandle === 'out') ?? edges[0]
  return preferred.target
}

function followBranch(
  workflow: WorkflowDefinition,
  sourceId: string,
  branch: 'yes' | 'no',
): string | null {
  const byHandle = workflow.edges.find(
    (edge) => edge.source === sourceId && (edge.sourceHandle ?? null) === branch,
  )
  if (byHandle) return byHandle.target

  const labeled = workflow.edges.find((edge) => {
    if (edge.source !== sourceId) return false
    const label = (edge.label || '').toLowerCase()
    if (branch === 'yes') return label === 'yes' || label === 'approve' || label === 'approved'
    return label === 'no' || label === 'reject' || label === 'rejected'
  })
  return labeled?.target ?? null
}

function evaluateFieldYes(
  formData: Record<string, unknown>,
  condition: { field: string; operator: string; value: string } | undefined,
): boolean {
  if (!condition?.field) return false
  const value = String(formData[condition.field] ?? '').trim()
  const expected = (condition.value ?? '').trim()
  const operator = condition.operator || 'equals'
  if (operator === 'equals') return value.toLowerCase() === expected.toLowerCase()
  if (operator === 'notEquals') return value.toLowerCase() !== expected.toLowerCase()
  return false
}

/**
 * Walk the happy path (approve / field-yes) and collect wait-for-action steps
 * that must complete before final approval.
 */
export function getRequiredApprovalNodes(
  workflow: WorkflowDefinition,
  formData: Record<string, unknown>,
): StoredNode[] {
  const start =
    workflow.nodes.find((node) => node.type === 'start') ?? workflow.nodes[0]
  if (!start) return []

  const steps: StoredNode[] = []
  let currentId: string | null = start.id
  let safety = 0

  while (currentId && safety < 50) {
    safety += 1
    const node = getNode(workflow, currentId)
    if (!node) break

    if (node.type === 'end') break

    if (node.type === 'step' && node.data.waitForAction) {
      steps.push(node)
      currentId = followSingle(workflow, node.id)
      continue
    }

    if (node.type === 'decision') {
      if ((node.data.decisionMode || 'manual') === 'field') {
        const yes = evaluateFieldYes(formData, node.data.fieldCondition)
        currentId = followBranch(workflow, node.id, yes ? 'yes' : 'no')
        continue
      }
      // Manual final decision — not a separate "approval step" row beyond manager wait
      break
    }

    currentId = followSingle(workflow, node.id)
  }

  return steps
}

function historyNodeIds(progress: WorkflowProgress | undefined): Set<string> {
  return new Set((progress?.history ?? []).map((entry) => entry.nodeId))
}

/**
 * Build the approval checklist for a staffing request: done / current / upcoming
 * (or rejected at the current wait step).
 */
export function getStaffingApprovalSteps(options: {
  workflow: WorkflowDefinition | undefined
  progress: WorkflowProgress | undefined
  phase: Phase
  company: string
  requestStatus: 'pending' | 'approved' | 'rejected'
}): StaffingApprovalStep[] {
  const { workflow, progress, phase, company, requestStatus } = options
  if (!workflow) return []

  const formData = { phase, company }
  const required = getRequiredApprovalNodes(workflow, formData)
  const visited = historyNodeIds(progress)
  const currentId = progress?.currentNodeId

  return required.map((node) => {
    const isCurrent = currentId === node.id
    let status: ApprovalStepStatus

    if (requestStatus === 'rejected' && isCurrent) {
      status = 'rejected'
    } else if (requestStatus === 'rejected' && visited.has(node.id) && !isCurrent) {
      // Left this step before a later rejection
      status = 'done'
    } else if (requestStatus === 'rejected' && !visited.has(node.id)) {
      status = 'upcoming'
    } else if (requestStatus === 'approved') {
      status = 'done'
    } else if (isCurrent) {
      status = 'current'
    } else if (visited.has(node.id) && !isCurrent) {
      status = 'done'
    } else {
      status = 'upcoming'
    }

    return {
      nodeId: node.id,
      label: node.data.label,
      roleId: node.data.roleId,
      status,
    }
  })
}

/** True when this role already completed its wait step on the happy path. */
export function hasRoleAlreadyApprovedStep(
  steps: StaffingApprovalStep[],
  roleIds: readonly string[],
): boolean {
  return steps.some(
    (step) => step.status === 'done' && roleIds.includes(step.roleId),
  )
}

/** True when this role is the one currently waiting to act. */
export function isRoleCurrentlyWaiting(
  steps: StaffingApprovalStep[],
  roleIds: readonly string[],
): boolean {
  return steps.some(
    (step) => step.status === 'current' && roleIds.includes(step.roleId),
  )
}
