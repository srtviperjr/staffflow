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

const STORAGE_KEY = 'project-authorization-requests'

interface ProjectAuthorizationContextValue {
  requests: ProjectAuthorizationRequest[]
  addRequest: (data: ProjectAuthorizationFormData, positionLabel: string, position: string) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string) => void
}

const ProjectAuthorizationContext = createContext<ProjectAuthorizationContextValue | null>(null)

function loadRequests(): ProjectAuthorizationRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ProjectAuthorizationRequest[]) : []
  } catch {
    return []
  }
}

function saveRequests(requests: ProjectAuthorizationRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function ProjectAuthorizationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ProjectAuthorizationRequest[]>(loadRequests)

  const persist = useCallback((updated: ProjectAuthorizationRequest[]) => {
    setRequests(updated)
    saveRequests(updated)
  }, [])

  const addRequest = useCallback(
    (
      data: ProjectAuthorizationFormData,
      positionLabel: string,
      position: string,
    ) => {
      const newRequest: ProjectAuthorizationRequest = {
        id: crypto.randomUUID(),
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
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }
      persist([newRequest, ...requests])
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

  const value = useMemo(
    () => ({ requests, addRequest, rejectRequest, approveRequest }),
    [requests, addRequest, rejectRequest, approveRequest],
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
