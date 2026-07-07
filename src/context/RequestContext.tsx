import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LabourChangeRequest, RequestFormData } from '../types/request'

const STORAGE_KEY = 'labour-change-requests'

interface RequestContextValue {
  requests: LabourChangeRequest[]
  addRequest: (data: RequestFormData) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string) => void
}

const RequestContext = createContext<RequestContextValue | null>(null)

function loadRequests(): LabourChangeRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as LabourChangeRequest[]) : []
  } catch {
    return []
  }
}

function saveRequests(requests: LabourChangeRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function RequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<LabourChangeRequest[]>(loadRequests)

  const persist = useCallback((updated: LabourChangeRequest[]) => {
    setRequests(updated)
    saveRequests(updated)
  }, [])

  const addRequest = useCallback(
    (data: RequestFormData) => {
      const newRequest: LabourChangeRequest = {
        id: crypto.randomUUID(),
        requesterName: data.requesterName.trim(),
        email: data.email.trim(),
        isUrgent: data.isUrgent === 'yes',
        project: data.project as LabourChangeRequest['project'],
        areaFunctionDiscipline: data.areaFunctionDiscipline.trim(),
        endorsingHeadName: data.endorsingHeadName.trim(),
        organization: data.organization as LabourChangeRequest['organization'],
        changeReason: data.changeReason.trim(),
        roleType: data.roleType as LabourChangeRequest['roleType'],
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
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  )
}

export function useRequests() {
  const context = useContext(RequestContext)
  if (!context) {
    throw new Error('useRequests must be used within a RequestProvider')
  }
  return context
}
