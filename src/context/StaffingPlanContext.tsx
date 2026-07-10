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
  generatePositionNumber,
  getCurrentStaffingPlanRequests,
  getStaffingRevisionHistory,
  normalizeStaffingPlanRequests,
} from '../utils/staffingPlanRevisions'

const STORAGE_KEY = 'staffing-plan-requests'

interface StaffingPlanContextValue {
  requests: StaffingPlanRequest[]
  currentRequests: StaffingPlanRequest[]
  addRequest: (data: StaffingPlanFormData) => StaffingPlanRequest
  reviseRequest: (sourceId: string, data: StaffingPlanFormData) => void
  rejectRequest: (id: string, comment: string) => void
  approveRequest: (id: string) => void
  getHistory: (revisionGroupId: string) => StaffingPlanRequest[]
}

const StaffingPlanContext = createContext<StaffingPlanContextValue | null>(null)

function loadRequests(): StaffingPlanRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored
      ? normalizeStaffingPlanRequests(JSON.parse(stored) as StaffingPlanRequest[])
      : []
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
): StaffingPlanRequest {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    revisionGroupId: overrides.revisionGroupId ?? crypto.randomUUID(),
    revision: overrides.revision ?? 1,
    supersedesId: overrides.supersedesId,
    isCurrentRevision: overrides.isCurrentRevision ?? true,
    positionNumber: overrides.positionNumber ?? generatePositionNumber(overrides.id ?? crypto.randomUUID()),
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
    sortNumber: data.sortNumber.trim(),
    totalHours: data.totalHours.trim(),
    hoursToGo: data.hoursToGo.trim(),
    roster: data.roster as StaffingPlanRequest['roster'],
    startBiWeek: data.startBiWeek,
    lwp: data.lwp,
    status: overrides.status ?? 'pending',
    submittedAt: overrides.submittedAt ?? new Date().toISOString(),
    rejectionComment: overrides.rejectionComment,
    reviewedAt: overrides.reviewedAt,
  }
}

export function StaffingPlanProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<StaffingPlanRequest[]>(loadRequests)

  const persist = useCallback((updated: StaffingPlanRequest[]) => {
    const normalized = normalizeStaffingPlanRequests(updated)
    setRequests(normalized)
    saveRequests(normalized)
  }, [])

  const addRequest = useCallback(
    (data: StaffingPlanFormData) => {
      const id = crypto.randomUUID()
      const newRequest = buildRequestFromForm(data, {
        id,
        revisionGroupId: id,
        revision: 1,
        isCurrentRevision: true,
        positionNumber: generatePositionNumber(id),
      })
      persist([newRequest, ...requests])
      return newRequest
    },
    [persist, requests],
  )

  const reviseRequest = useCallback(
    (sourceId: string, data: StaffingPlanFormData) => {
      const source = requests.find((request) => request.id === sourceId)
      if (!source) return

      const newRequest = buildRequestFromForm(data, {
        revisionGroupId: source.revisionGroupId,
        revision: source.revision + 1,
        supersedesId: source.id,
        isCurrentRevision: true,
        positionNumber: source.positionNumber,
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
