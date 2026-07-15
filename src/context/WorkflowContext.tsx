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
  WorkflowFormType,
  WorkflowNodeUpdate,
  WorkflowState,
} from '../types/workflow'
import { SAMPLE_WORKFLOWS } from '../data/sampleWorkflow'
import { getWorkflowForForm, normalizeWorkflowDefinition } from '../utils/workflowEngine'

const STORAGE_KEY = 'workflow-definitions'

interface WorkflowContextValue {
  workflows: WorkflowDefinition[]
  getWorkflow: (id: string) => WorkflowDefinition | undefined
  getWorkflowByForm: (formType: WorkflowFormType) => WorkflowDefinition | undefined
  saveWorkflow: (workflow: WorkflowDefinition) => void
  createWorkflow: (name: string, description?: string) => WorkflowDefinition
  updateNodeData: (workflowId: string, nodeId: string, update: WorkflowNodeUpdate) => void
  addState: (workflowId: string, state: Omit<WorkflowState, 'id'>) => WorkflowState
  resetSampleData: () => void
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null)

function migrateAndSeed(raw: WorkflowDefinition[]): WorkflowDefinition[] {
  const normalized = raw.map(normalizeWorkflowDefinition)
  const byId = new Map(normalized.map((workflow) => [workflow.id, workflow]))

  // Ensure both canonical form workflows exist (upgrade from older single-sample storage)
  for (const sample of SAMPLE_WORKFLOWS) {
    const existing = byId.get(sample.id)
    if (!existing) {
      byId.set(sample.id, sample)
      continue
    }
    // Upgrade legacy copies that lack formType
    if (existing.formType == null && sample.formType) {
      byId.set(sample.id, {
        ...existing,
        formType: sample.formType,
        description: existing.description || sample.description,
      })
    }
  }

  return Array.from(byId.values())
}

function loadWorkflows(): WorkflowDefinition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as WorkflowDefinition[]
      const migrated = migrateAndSeed(parsed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    const seeded = SAMPLE_WORKFLOWS.map(normalizeWorkflowDefinition)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  } catch {
    return SAMPLE_WORKFLOWS.map(normalizeWorkflowDefinition)
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

  const getWorkflowByForm = useCallback(
    (formType: WorkflowFormType) => getWorkflowForForm(workflows, formType),
    [workflows],
  )

  const saveWorkflow = useCallback(
    (workflow: WorkflowDefinition) => {
      const withTimestamp = normalizeWorkflowDefinition({
        ...workflow,
        updatedAt: new Date().toISOString(),
      })

      // Enforce one workflow per form type: clear formType on others when claimed
      let next = workflows.map((item) => {
        if (item.id === withTimestamp.id) return withTimestamp
        if (
          withTimestamp.formType &&
          item.formType === withTimestamp.formType &&
          item.id !== withTimestamp.id
        ) {
          return { ...item, formType: null }
        }
        return item
      })

      if (!workflows.some((item) => item.id === withTimestamp.id)) {
        next = [...next, withTimestamp]
      }

      persist(next)
    },
    [persist, workflows],
  )

  const createWorkflow = useCallback(
    (name: string, description = '') => {
      const created: WorkflowDefinition = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        formType: null,
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
              waitForAction: false,
            },
          },
        ],
        edges: [],
        updatedAt: new Date().toISOString(),
      }
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
    persist(SAMPLE_WORKFLOWS.map(normalizeWorkflowDefinition))
  }, [persist])

  const value = useMemo(
    () => ({
      workflows,
      getWorkflow,
      getWorkflowByForm,
      saveWorkflow,
      createWorkflow,
      updateNodeData,
      addState,
      resetSampleData,
    }),
    [
      workflows,
      getWorkflow,
      getWorkflowByForm,
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
