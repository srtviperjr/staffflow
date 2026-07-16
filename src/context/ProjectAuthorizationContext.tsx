import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ProjectAuthorizationFormData,
  ProjectAuthorizationRequest,
} from '../types/projectAuthorization'
import {
  authorizationPafNumbersChanged,
  getCurrentAuthorizationRequests,
  getRevisionHistory,
  nextPafNumber,
  normalizeAuthorizationRequests,
  requestToFormData,
  validatePafSchedule,
} from '../utils/projectAuthorizationRevisions'
import { SAMPLE_PROJECT_AUTHORIZATION_REQUESTS } from '../data/sampleData'
import type { WorkflowActor } from '../types/workflow'
import { useRoles } from './RolesContext'
import { useStaffingPlanRequests } from './StaffingPlanContext'
import { useWorkflows } from './WorkflowContext'
import { advanceWorkflow, startWorkflow } from '../utils/workflowEngine'

function toWorkflowActor(
  user: { id: string; name: string } | null | undefined,
): WorkflowActor | undefined {
  if (!user) return undefined
  return { userId: user.id, name: user.name }
}

const STORAGE_KEY = 'project-authorization-requests'

interface ProjectAuthorizationContextValue {
  requests: ProjectAuthorizationRequest[]
  currentRequests: ProjectAuthorizationRequest[]
  addRequest: (
    data: ProjectAuthorizationFormData,
    positionLabel: string,
    position: string,
  ) => ProjectAuthorizationRequest
  reviseRequest: (
    sourceId: string,
    data: ProjectAuthorizationFormData,
    positionLabel: string,
    position: string,
  ) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string) => void
  getHistory: (revisionGroupId: string) => ProjectAuthorizationRequest[]
}

const ProjectAuthorizationContext = createContext<ProjectAuthorizationContextValue | null>(null)

function loadRequests(): ProjectAuthorizationRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ProjectAuthorizationRequest[]
      const normalized = normalizeAuthorizationRequests(parsed)
      // Persist repairs when legacy UUID-style numbers (e.g. 55B4EF40) are rewritten.
      if (authorizationPafNumbersChanged(parsed, normalized)) {
        saveRequests(normalized)
      }
      return normalized
    }

    const seeded = normalizeAuthorizationRequests(SAMPLE_PROJECT_AUTHORIZATION_REQUESTS)
    saveRequests(seeded)
    return seeded
  } catch {
    return []
  }
}

function saveRequests(requests: ProjectAuthorizationRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

function buildRequestFromForm(
  data: ProjectAuthorizationFormData,
  positionLabel: string,
  position: string,
  overrides: Partial<ProjectAuthorizationRequest>,
): ProjectAuthorizationRequest {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    revisionGroupId: overrides.revisionGroupId ?? crypto.randomUUID(),
    revision: overrides.revision ?? 1,
    supersedesId: overrides.supersedesId,
    isCurrentRevision: overrides.isCurrentRevision ?? true,
    staffingPlanRequestId: data.staffingPlanRequestId,
    functionalGroup: data.functionalGroup,
    dsg: data.dsg.trim(),
    approvedPositionLabel: positionLabel,
    position,
    candidateName: data.candidateName.trim(),
    country: data.country.trim(),
    class: data.class,
    company: data.company as ProjectAuthorizationRequest['company'],
    eeIdSap: data.eeIdSap.trim(),
    pafNumber: overrides.pafNumber ?? nextPafNumber(),
    sortNumber: data.sortNumber.trim(),
    totalHours: data.totalHours.trim(),
    roster: data.roster,
    startBiWeek: data.startBiWeek,
    lwp: data.lwp,
    status: overrides.status ?? 'pending',
    submittedAt: overrides.submittedAt ?? new Date().toISOString(),
    rejectionComment: overrides.rejectionComment,
    reviewedAt: overrides.reviewedAt,
    workflow: overrides.workflow,
  }
}

function requestAsFormRecord(request: ProjectAuthorizationRequest): Record<string, unknown> {
  return { ...request }
}

export function ProjectAuthorizationProvider({ children }: { children: ReactNode }) {
  const { getWorkflowByForm, getWorkflow } = useWorkflows()
  const { currentUser } = useRoles()
  const { requests: staffingRequests } = useStaffingPlanRequests()
  const [requests, setRequests] = useState<ProjectAuthorizationRequest[]>(loadRequests)

  const persist = useCallback((updated: ProjectAuthorizationRequest[]) => {
    const normalized = normalizeAuthorizationRequests(updated)
    setRequests(normalized)
    saveRequests(normalized)
  }, [])

  const assertPafSchedule = useCallback(
    (data: ProjectAuthorizationFormData, exceptRevisionGroupId?: string) => {
      const position = staffingRequests.find(
        (request) => request.id === data.staffingPlanRequestId,
      )
      if (!position) {
        throw new Error('Approved staffing plan position was not found.')
      }

      const errors = validatePafSchedule({
        range: { startBiWeek: data.startBiWeek, lwp: data.lwp },
        position,
        authorizations: requests,
        staffingRequests,
        exceptRevisionGroupId,
      })
      const message = errors.startBiWeek ?? errors.lwp ?? errors.staffingPlanRequestId
      if (message) throw new Error(message)
    },
    [requests, staffingRequests],
  )

  const addRequest = useCallback(
    (data: ProjectAuthorizationFormData, positionLabel: string, position: string) => {
      assertPafSchedule(data)

      const id = crypto.randomUUID()
      const workflow = getWorkflowByForm('project-authorization')
      let status: ProjectAuthorizationRequest['status'] = 'pending'
      let workflowProgress: ProjectAuthorizationRequest['workflow']

      if (workflow) {
        const result = startWorkflow(
          workflow,
          {
            ...data,
            position,
            approvedPositionLabel: positionLabel,
          },
          undefined,
          toWorkflowActor(currentUser),
        )
        status = result.status
        workflowProgress = result.progress
      }

      const newRequest = buildRequestFromForm(data, positionLabel, position, {
        id,
        revisionGroupId: id,
        revision: 1,
        isCurrentRevision: true,
        pafNumber: nextPafNumber(requests),
        status,
        workflow: workflowProgress,
      })
      persist([newRequest, ...requests])
      return newRequest
    },
    [assertPafSchedule, persist, requests, getWorkflowByForm, currentUser],
  )

  const reviseRequest = useCallback(
    (
      sourceId: string,
      data: ProjectAuthorizationFormData,
      positionLabel: string,
      position: string,
    ) => {
      const source = requests.find((request) => request.id === sourceId)
      if (!source) return

      assertPafSchedule(data, source.revisionGroupId)

      const workflow = getWorkflowByForm('project-authorization')
      let status: ProjectAuthorizationRequest['status'] = 'pending'
      let workflowProgress: ProjectAuthorizationRequest['workflow']

      if (workflow) {
        const previousFormData = {
          ...requestToFormData(source),
          position: source.position,
          approvedPositionLabel: source.approvedPositionLabel,
        } as Record<string, unknown>
        const result = startWorkflow(
          workflow,
          {
            ...data,
            position,
            approvedPositionLabel: positionLabel,
          },
          previousFormData,
          toWorkflowActor(currentUser),
        )
        status = result.status
        workflowProgress = result.progress
      }

      const newRequest = buildRequestFromForm(data, positionLabel, position, {
        revisionGroupId: source.revisionGroupId,
        revision: source.revision + 1,
        supersedesId: source.id,
        isCurrentRevision: true,
        pafNumber: source.pafNumber,
        status,
        workflow: workflowProgress,
      })

      const updatedRequests = requests.map((request) =>
        request.revisionGroupId === source.revisionGroupId
          ? { ...request, isCurrentRevision: false }
          : request,
      )

      persist([newRequest, ...updatedRequests])
    },
    [assertPafSchedule, persist, requests, getWorkflowByForm, currentUser],
  )

  const rejectRequest = useCallback(
    (id: string, comment: string) => {
      const actor = toWorkflowActor(currentUser)
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
                undefined,
                actor,
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
    [persist, requests, getWorkflow, currentUser],
  )

  const approveRequest = useCallback(
    (id: string) => {
      const actor = toWorkflowActor(currentUser)
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
                'approve',
                undefined,
                actor,
              )
              return {
                ...request,
                status: result.status === 'pending' && result.completed ? 'approved' : result.status,
                reviewedAt: new Date().toISOString(),
                rejectionComment: undefined,
                workflow: result.progress,
              }
            }
          }

          return {
            ...request,
            status: 'approved' as const,
            reviewedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [persist, requests, getWorkflow, currentUser],
  )

  const currentRequests = useMemo(() => getCurrentAuthorizationRequests(requests), [requests])

  const getHistory = useCallback(
    (revisionGroupId: string) => getRevisionHistory(requests, revisionGroupId),
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
    <ProjectAuthorizationContext.Provider value={value}>
      {children}
    </ProjectAuthorizationContext.Provider>
  )
}

export function useProjectAuthorizationRequests() {
  const context = useContext(ProjectAuthorizationContext)
  if (!context) {
    throw new Error(
      'useProjectAuthorizationRequests must be used within a ProjectAuthorizationProvider',
    )
  }
  return context
}
