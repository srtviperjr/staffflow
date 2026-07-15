import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  WorkflowDefinition,
  WorkflowNodeUpdate,
  WorkflowState,
} from '../types/workflow'
import { SAMPLE_WORKFLOW } from '../data/sampleWorkflow'

const STORAGE_KEY = 'workflow-definitions'

interface WorkflowContextValue {
  workflows: WorkflowDefinition[]
  getWorkflow: (id: string) => WorkflowDefinition | undefined
  saveWorkflow: (workflow: WorkflowDefinition) => void
  createWorkflow: (name: string, description?: string) => WorkflowDefinition
  updateNodeData: (workflowId: string, nodeId: string, update: WorkflowNodeUpdate) => void
  addState: (workflowId: string, state: Omit<WorkflowState, 'id'>) => WorkflowState
  resetSampleData: () => void
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null)

function loadWorkflows(): WorkflowDefinition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as WorkflowDefinition[]
    }
    const seeded = [SAMPLE_WORKFLOW]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  } catch {
    return [SAMPLE_WORKFLOW]
  }
}

function saveWorkflows(workflows: WorkflowDefinition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(loadWorkflows)

  const persist = useCallback((next: WorkflowDefinition[]) => {
    setWorkflows(next)
    saveWorkflows(next)
  }, [])

  const getWorkflow = useCallback(
    (id: string) => workflows.find((workflow) => workflow.id === id),
    [workflows],
  )

  const saveWorkflow = useCallback(
    (workflow: WorkflowDefinition) => {
      const withTimestamp = { ...workflow, updatedAt: new Date().toISOString() }
      persist(
        workflows.some((item) => item.id === workflow.id)
          ? workflows.map((item) => (item.id === workflow.id ? withTimestamp : item))
          : [...workflows, withTimestamp],
      )
    },
    [persist, workflows],
  )

  const createWorkflow = useCallback(
    (name: string, description = '') => {
      const created: WorkflowDefinition = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        states: [
          { id: crypto.randomUUID(), name: 'Draft', color: '#757575' },
          { id: crypto.randomUUID(), name: 'In Progress', color: '#1976d2' },
          { id: crypto.randomUUID(), name: 'Approved', color: '#2e7d32' },
          { id: crypto.randomUUID(), name: 'Rejected', color: '#c62828' },
        ],
        nodes: [
          {
            id: crypto.randomUUID(),
            type: 'start',
            position: { x: 250, y: 0 },
            data: {
              kind: 'start',
              label: 'Start',
              roleId: '',
              stateId: '',
            },
          },
        ],
        edges: [],
        updatedAt: new Date().toISOString(),
      }
      // Wire default start state to first state if present
      if (created.states[0]) {
        created.nodes[0].data.stateId = created.states[0].id
      }
      persist([...workflows, created])
      return created
    },
    [persist, workflows],
  )

  const updateNodeData = useCallback(
    (workflowId: string, nodeId: string, update: WorkflowNodeUpdate) => {
      persist(
        workflows.map((workflow) => {
          if (workflow.id !== workflowId) return workflow
          return {
            ...workflow,
            updatedAt: new Date().toISOString(),
            nodes: workflow.nodes.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      ...update,
                      label: update.label?.trim() || node.data.label,
                    },
                  }
                : node,
            ),
          }
        }),
      )
    },
    [persist, workflows],
  )

  const addState = useCallback(
    (workflowId: string, state: Omit<WorkflowState, 'id'>) => {
      const created: WorkflowState = {
        id: crypto.randomUUID(),
        name: state.name.trim(),
        color: state.color,
      }
      persist(
        workflows.map((workflow) =>
          workflow.id === workflowId
            ? {
                ...workflow,
                states: [...workflow.states, created],
                updatedAt: new Date().toISOString(),
              }
            : workflow,
        ),
      )
      return created
    },
    [persist, workflows],
  )

  const resetSampleData = useCallback(() => {
    persist([SAMPLE_WORKFLOW])
  }, [persist])

  const value = useMemo(
    () => ({
      workflows,
      getWorkflow,
      saveWorkflow,
      createWorkflow,
      updateNodeData,
      addState,
      resetSampleData,
    }),
    [
      workflows,
      getWorkflow,
      saveWorkflow,
      createWorkflow,
      updateNodeData,
      addState,
      resetSampleData,
    ],
  )

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
}

export function useWorkflows() {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error('useWorkflows must be used within a WorkflowProvider')
  }
  return context
}
