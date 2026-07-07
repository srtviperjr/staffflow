import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ApprovalDetails,
  OnboardingRequest,
  RequestFormData,
} from '../types/request'
import {
  SESSION_KEYS,
  getSessionItem,
  migrateLegacyLocalStorage,
  setSessionItem,
} from '../storage/sessionStorage'

const STORAGE_KEY = SESSION_KEYS.REQUESTS

interface RequestContextValue {
  requests: OnboardingRequest[]
  addRequest: (data: RequestFormData) => void
  rejectRequest: (id: string, reason: string) => void
  approveRequest: (id: string, details: ApprovalDetails) => void
}

const RequestContext = createContext<RequestContextValue | null>(null)

function loadRequests(): OnboardingRequest[] {
  migrateLegacyLocalStorage()
  return getSessionItem<OnboardingRequest[]>(STORAGE_KEY, [])
}

function saveRequests(requests: OnboardingRequest[]) {
  setSessionItem(STORAGE_KEY, requests)
}

export function RequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<OnboardingRequest[]>(loadRequests)

  const persist = useCallback((updated: OnboardingRequest[]) => {
    setRequests(updated)
    saveRequests(updated)
  }, [])

  const addRequest = useCallback(
    (data: RequestFormData) => {
      const newRequest: OnboardingRequest = {
        id: crypto.randomUUID(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        requestingManagerName: data.requestingManagerName.trim(),
        startDate: data.startDate,
        role: data.role as OnboardingRequest['role'],
        department: data.department as OnboardingRequest['department'],
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }
      persist([newRequest, ...requests])
    },
    [persist, requests],
  )

  const rejectRequest = useCallback(
    (id: string, reason: string) => {
      persist(
        requests.map((request) =>
          request.id === id
            ? { ...request, status: 'rejected' as const, rejectionReason: reason.trim() }
            : request,
        ),
      )
    },
    [persist, requests],
  )

  const approveRequest = useCallback(
    (id: string, details: ApprovalDetails) => {
      persist(
        requests.map((request) =>
          request.id === id
            ? { ...request, status: 'approved' as const, approvalDetails: details }
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
