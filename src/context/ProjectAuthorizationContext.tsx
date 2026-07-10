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
  getCurrentAuthorizationRequests,
  getRevisionHistory,
  normalizeAuthorizationRequests,
} from '../utils/projectAuthorizationRevisions'

const STORAGE_KEY = 'project-authorization-requests'

interface ProjectAuthorizationContextValue {
  requests: ProjectAuthorizationRequest[]
  currentRequests: ProjectAuthorizationRequest[]
  addRequest: (data: ProjectAuthorizationFormData, positionLabel: string, position: string) => void
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
    return stored
      ? normalizeAuthorizationRequests(JSON.parse(stored) as ProjectAuthorizationRequest[])
      : []
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
    hiringSource: data.hiringSource,
    eeIdSap: data.eeIdSap.trim(),
    sortNumber: data.sortNumber.trim(),
    totalHours: data.totalHours.trim(),
    roster: data.roster,
    startBiWeek: data.startBiWeek,
    lwp: data.lwp,
    status: overrides.status ?? 'pending',
    submittedAt: overrides.submittedAt ?? new Date().toISOString(),
    rejectionComment: overrides.rejectionComment,
    reviewedAt: overrides.reviewedAt,
  }
}

export function ProjectAuthorizationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ProjectAuthorizationRequest[]>(loadRequests)

  const persist = useCallback((updated: ProjectAuthorizationRequest[]) => {
    const normalized = normalizeAuthorizationRequests(updated)
    setRequests(normalized)
    saveRequests(normalized)
  }, [])

  const addRequest = useCallback(
    (data: ProjectAuthorizationFormData, positionLabel: string, position: string) => {
      const id = crypto.randomUUID()
      const newRequest = buildRequestFromForm(data, positionLabel, position, {
        id,
        revisionGroupId: id,
        revision: 1,
        isCurrentRevision: true,
      })
      persist([newRequest, ...requests])
    },
    [persist, requests],
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

      const newRequest = buildRequestFromForm(data, positionLabel, position, {
        revisionGroupId: source.revisionGroupId,
        revision: source.revision + 1,
        supersedesId: source.id,
        isCurrentRevision: true,
      })

      const updatedRequests = requests.map((request) =>
        request.revisionGroupId === source.revisionGroupId
          ? { ...request, isCurrentRevision: false }
          : request,
      )

      persist([newRequest, ...updatedRequests])
    },
    [persist, requests],
  )

  const rejectRequest = useCallback(
    (id: string, comment: string) => {
      persist(
        requests.map((request) =>
          request.id === id
            ? {
                ...request,
                status: 'rejected' as const,
                rejectionComment: comment.trim(),
                reviewedAt: new Date().toISOString(),
              }
            : request,
        ),
      )
    },
    [persist, requests],
  )

  const approveRequest = useCallback(
    (id: string) => {
      persist(
        requests.map((request) =>
          request.id === id
            ? {
                ...request,
                status: 'approved' as const,
                reviewedAt: new Date().toISOString(),
              }
            : request,
        ),
      )
    },
    [persist, requests],
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
