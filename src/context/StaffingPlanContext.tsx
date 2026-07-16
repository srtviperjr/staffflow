import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { StaffingPlanFormData, StaffingPlanRequest } from '../types/staffingPlan'
import {
  getCurrentStaffingPlanRequests,
  getStaffingRevisionHistory,
  nextPositionNumber,
  normalizeStaffingPlanRequests,
  requestToStaffingFormData,
  staffingPositionNumbersChanged,
} from '../utils/staffingPlanRevisions'
import { SAMPLE_STAFFING_PLAN_REQUESTS } from '../data/sampleData'
import { useWorkflows } from './WorkflowContext'
import { advanceWorkflow, startWorkflow } from '../utils/workflowEngine'

const STORAGE_KEY = 'staffing-plan-requests'

interface StaffingPlanContextValue {
  requests: StaffingPlanRequest[]
  currentRequests: StaffingPlanRequest[]
  addRequest: (data: StaffingPlanFormData) => StaffingPlanRequest
  reviseRequest: (sourceId: string, data: StaffingPlanFormData) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string, options?: { hourlyCost?: string }) => void
  getHistory: (revisionGroupId: string) => StaffingPlanRequest[]
}

const StaffingPlanContext = createContext<StaffingPlanContextValue | null>(null)

function loadRequests(): StaffingPlanRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as StaffingPlanRequest[]
      const normalized = normalizeStaffingPlanRequests(parsed)
      // Persist repairs when legacy UUID / HA001-style numbers become Company-###.
      if (staffingPositionNumbersChanged(parsed, normalized)) {
        saveRequests(normalized)
      }
      return normalized
    }

    const seeded = normalizeStaffingPlanRequests(SAMPLE_STAFFING_PLAN_REQUESTS)
    saveRequests(seeded)
    return seeded
  } catch {
    return []
  }
}

function saveRequests(requests: StaffingPlanRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

function buildRequestFromForm(
  data: StaffingPlanFormData,
  overrides: Partial<StaffingPlanRequest>,
  existing: StaffingPlanRequest[] = [],
): StaffingPlanRequest {
  const company = data.company as StaffingPlanRequest['company']
  return {
    id: overrides.id ?? crypto.randomUUID(),
    revisionGroupId: overrides.revisionGroupId ?? crypto.randomUUID(),
    revision: overrides.revision ?? 1,
    supersedesId: overrides.supersedesId,
    isCurrentRevision: overrides.isCurrentRevision ?? true,
    phase: data.phase as StaffingPlanRequest['phase'],
    positionNumber:
      overrides.positionNumber ??
      nextPositionNumber(data.phase as StaffingPlanRequest['phase'], existing),
    locationType: data.locationType as StaffingPlanRequest['locationType'],
    functionalGroup: data.functionalGroup as StaffingPlanRequest['functionalGroup'],
    dsg: data.dsg.trim(),
    area: data.area as StaffingPlanRequest['area'],
    subArea: data.subArea as StaffingPlanRequest['subArea'],
    country: data.country.trim(),
    discipline: data.discipline as StaffingPlanRequest['discipline'],
    position: data.position.trim(),
    class: data.class as StaffingPlanRequest['class'],
    company,
    eeIdSap: data.eeIdSap.trim(),
    sortNumber: data.sortNumber.trim(),
    totalHours: data.totalHours.trim(),
    hoursToGo: data.hoursToGo.trim(),
    hourlyCost: data.hourlyCost.trim(),
    roster: data.roster as StaffingPlanRequest['roster'],
    startBiWeek: data.startBiWeek,
    lwp: data.lwp,
    status: overrides.status ?? 'pending',
    submittedAt: overrides.submittedAt ?? new Date().toISOString(),
    rejectionComment: overrides.rejectionComment,
    reviewedAt: overrides.reviewedAt,
    workflow: overrides.workflow,
  }
}

function requestAsFormRecord(request: StaffingPlanRequest): Record<string, unknown> {
  return { ...request }
}

export function StaffingPlanProvider({ children }: { children: ReactNode }) {
  const { getWorkflowByForm, getWorkflow } = useWorkflows()
  const [requests, setRequests] = useState<StaffingPlanRequest[]>(loadRequests)

  const persist = useCallback((updated: StaffingPlanRequest[]) => {
    const normalized = normalizeStaffingPlanRequests(updated)
    setRequests(normalized)
    saveRequests(normalized)
  }, [])

  const addRequest = useCallback(
    (data: StaffingPlanFormData) => {
      const id = crypto.randomUUID()
      const workflow = getWorkflowByForm('staffing-plan')
      let status: StaffingPlanRequest['status'] = 'pending'
      let workflowProgress: StaffingPlanRequest['workflow']

      if (workflow) {
        const result = startWorkflow(workflow, data as unknown as Record<string, unknown>)
        status = result.status
        workflowProgress = result.progress
      }

      const newRequest = buildRequestFromForm(
        data,
        {
          id,
          revisionGroupId: id,
          revision: 1,
          isCurrentRevision: true,
          positionNumber: nextPositionNumber(data.phase, requests),
          status,
          workflow: workflowProgress,
        },
        requests,
      )
      persist([newRequest, ...requests])
      return newRequest
    },
    [persist, requests, getWorkflowByForm],
  )

  const reviseRequest = useCallback(
    (sourceId: string, data: StaffingPlanFormData) => {
      const source = requests.find((request) => request.id === sourceId)
      if (!source) return

      const workflow = getWorkflowByForm('staffing-plan')
      let status: StaffingPlanRequest['status'] = 'pending'
      let workflowProgress: StaffingPlanRequest['workflow']

      if (workflow) {
        const previousFormData = requestToStaffingFormData(source) as unknown as Record<
          string,
          unknown
        >
        const result = startWorkflow(
          workflow,
          data as unknown as Record<string, unknown>,
          previousFormData,
        )
        status = result.status
        workflowProgress = result.progress
      }

      const newRequest = buildRequestFromForm(
        data,
        {
          revisionGroupId: source.revisionGroupId,
          revision: source.revision + 1,
          supersedesId: source.id,
          isCurrentRevision: true,
          positionNumber: source.positionNumber,
          status,
          workflow: workflowProgress,
        },
        requests,
      )

      const updatedRequests = requests.map((request) =>
        request.revisionGroupId === source.revisionGroupId
          ? { ...request, isCurrentRevision: false }
          : request,
      )

      persist([newRequest, ...updatedRequests])
    },
    [persist, requests, getWorkflowByForm],
  )

  const rejectRequest = useCallback(
    (id: string, comment: string) => {
      persist(
        requests.map((request) => {
          if (request.id !== id) return request

          if (request.workflow) {
            const workflow = getWorkflow(request.workflow.workflowId)
            if (workflow) {
              const result = advanceWorkflow(
                workflow,
                request.workflow,
                requestAsFormRecord(request),
                'reject',
              )
              return {
                ...request,
                status: result.status === 'pending' ? 'rejected' : result.status,
                rejectionComment: comment.trim(),
                reviewedAt: new Date().toISOString(),
                workflow: result.progress,
              }
            }
          }

          return {
            ...request,
            status: 'rejected' as const,
            rejectionComment: comment.trim(),
            reviewedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [persist, requests, getWorkflow],
  )

  const approveRequest = useCallback(
    (id: string, options?: { hourlyCost?: string }) => {
      persist(
        requests.map((request) => {
          if (request.id !== id) return request

          const withCost =
            options?.hourlyCost !== undefined
              ? { ...request, hourlyCost: options.hourlyCost.trim() }
              : request

          if (withCost.workflow) {
            const workflow = getWorkflow(withCost.workflow.workflowId)
            if (workflow) {
              const result = advanceWorkflow(
                workflow,
                withCost.workflow,
                requestAsFormRecord(withCost),
                'approve',
              )
              return {
                ...withCost,
                status: result.status === 'pending' && result.completed ? 'approved' : result.status,
                reviewedAt: new Date().toISOString(),
                rejectionComment: undefined,
                workflow: result.progress,
              }
            }
          }

          return {
            ...withCost,
            status: 'approved' as const,
            reviewedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [persist, requests, getWorkflow],
  )

  const currentRequests = useMemo(() => getCurrentStaffingPlanRequests(requests), [requests])

  const getHistory = useCallback(
    (revisionGroupId: string) => getStaffingRevisionHistory(requests, revisionGroupId),
    [requests],
  )

  const value = useMemo(
    () => ({
      requests,
      currentRequests,
      addRequest,
      reviseRequest,
      rejectRequest,
      approveRequest,
      getHistory,
    }),
    [requests, currentRequests, addRequest, reviseRequest, rejectRequest, approveRequest, getHistory],
  )

  return (
    <StaffingPlanContext.Provider value={value}>{children}</StaffingPlanContext.Provider>
  )
}

export function useStaffingPlanRequests() {
  const context = useContext(StaffingPlanContext)
  if (!context) {
    throw new Error('useStaffingPlanRequests must be used within a StaffingPlanProvider')
  }
  return context
}
