import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { StaffingPlanFormData, StaffingPlanRequest } from '../types/staffingPlan'

const STORAGE_KEY = 'staffing-plan-requests'

interface StaffingPlanContextValue {
  requests: StaffingPlanRequest[]
  addRequest: (data: StaffingPlanFormData) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string) => void
}

const StaffingPlanContext = createContext<StaffingPlanContextValue | null>(null)

function loadRequests(): StaffingPlanRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as StaffingPlanRequest[]) : []
  } catch {
    return []
  }
}

function saveRequests(requests: StaffingPlanRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function StaffingPlanProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<StaffingPlanRequest[]>(loadRequests)

  const persist = useCallback((updated: StaffingPlanRequest[]) => {
    setRequests(updated)
    saveRequests(updated)
  }, [])

  const addRequest = useCallback(
    (data: StaffingPlanFormData) => {
      const newRequest: StaffingPlanRequest = {
        id: crypto.randomUUID(),
        phase: data.phase as StaffingPlanRequest['phase'],
        locationType: data.locationType as StaffingPlanRequest['locationType'],
        functionalGroup: data.functionalGroup as StaffingPlanRequest['functionalGroup'],
        dsg: data.dsg.trim(),
        area: data.area as StaffingPlanRequest['area'],
        subArea: data.subArea as StaffingPlanRequest['subArea'],
        country: data.country.trim(),
        discipline: data.discipline as StaffingPlanRequest['discipline'],
        position: data.position.trim(),
        class: data.class as StaffingPlanRequest['class'],
        hiringSource: data.hiringSource as StaffingPlanRequest['hiringSource'],
        eeIdSap: data.eeIdSap.trim(),
        pafStatus: data.pafStatus.trim(),
        sortNumber: data.sortNumber.trim(),
        totalHours: data.totalHours.trim(),
        hoursToGo: data.hoursToGo.trim(),
        roster: data.roster as StaffingPlanRequest['roster'],
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
