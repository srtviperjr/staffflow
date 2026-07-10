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
  OnboardingFormData,
  OnboardingRequest,
} from '../types/onboarding'

const STORAGE_KEY = 'onboarding-requests'

interface OnboardingContextValue {
  requests: OnboardingRequest[]
  addRequest: (data: OnboardingFormData) => void
  rejectRequest: (id: string, reason: string) => void
  approveRequest: (id: string, details: ApprovalDetails) => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function loadRequests(): OnboardingRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as OnboardingRequest[]) : []
  } catch {
    return []
  }
}

function saveRequests(requests: OnboardingRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<OnboardingRequest[]>(loadRequests)

  const persist = useCallback((updated: OnboardingRequest[]) => {
    setRequests(updated)
    saveRequests(updated)
  }, [])

  const addRequest = useCallback(
    (data: OnboardingFormData) => {
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
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  )
}

export function useOnboardingRequests() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingRequests must be used within an OnboardingProvider')
  }
  return context
}
