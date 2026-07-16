import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Alert, Snackbar } from '@mui/material'
import RequestFormDialog from '../components/RequestFormDialog'
import ProjectAuthorizationFormPage from '../pages/authorization/ProjectAuthorizationFormPage'
import StaffingPlanFormPage from '../pages/staffing/StaffingPlanFormPage'

export type RequestFormKind = 'staffing-plan' | 'project-authorization'

export type OpenRequestFormOptions = {
  reviseRequestId?: string
  positionId?: string
}

type ActiveRequestForm = {
  kind: RequestFormKind
} & OpenRequestFormOptions

type RequestFormsContextValue = {
  openRequestForm: (kind: RequestFormKind, options?: OpenRequestFormOptions) => void
  closeRequestForm: () => void
  activeForm: ActiveRequestForm | null
}

const RequestFormsContext = createContext<RequestFormsContextValue | null>(null)

function dialogCopy(active: ActiveRequestForm) {
  const revising = Boolean(active.reviseRequestId)
  if (active.kind === 'staffing-plan') {
    return {
      title: revising ? 'Revise Position Request' : 'Staffing Plan Position Request',
      subtitle: revising
        ? 'Each update is saved as a new revision for review.'
        : 'Submit a new position request for the staffing plan',
    }
  }
  return {
    title: revising ? 'Revise PAF Request' : 'PAF Request',
    subtitle: revising
      ? 'Each update is saved as a new revision for review.'
      : 'Assign one person to an approved position. Multiple people can fill it if dates do not overlap.',
  }
}

export function RequestFormsProvider({ children }: { children: ReactNode }) {
  const [activeForm, setActiveForm] = useState<ActiveRequestForm | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const openRequestForm = useCallback(
    (kind: RequestFormKind, options: OpenRequestFormOptions = {}) => {
      setActiveForm({ kind, ...options })
    },
    [],
  )

  const closeRequestForm = useCallback(() => {
    setActiveForm(null)
  }, [])

  const handleSubmitted = useCallback(
    (message: string) => {
      setSuccessMessage(message)
      setActiveForm(null)
    },
    [],
  )

  const value = useMemo(
    () => ({ openRequestForm, closeRequestForm, activeForm }),
    [openRequestForm, closeRequestForm, activeForm],
  )

  const copy = activeForm ? dialogCopy(activeForm) : null

  return (
    <RequestFormsContext.Provider value={value}>
      {children}

      {activeForm && copy ? (
        <RequestFormDialog
          open
          title={copy.title}
          subtitle={copy.subtitle}
          onClose={closeRequestForm}
          maxWidth="md"
        >
          {activeForm.kind === 'staffing-plan' ? (
            <StaffingPlanFormPage
              dialogMode
              reviseRequestId={activeForm.reviseRequestId}
              onClose={closeRequestForm}
              onSubmitted={handleSubmitted}
              onOpenRevise={(requestId) =>
                openRequestForm('staffing-plan', { reviseRequestId: requestId })
              }
            />
          ) : (
            <ProjectAuthorizationFormPage
              dialogMode
              reviseRequestId={activeForm.reviseRequestId}
              positionId={activeForm.positionId}
              onClose={closeRequestForm}
              onSubmitted={handleSubmitted}
              onOpenRevise={(requestId) =>
                openRequestForm('project-authorization', { reviseRequestId: requestId })
              }
            />
          )}
        </RequestFormDialog>
      ) : null}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </RequestFormsContext.Provider>
  )
}

export function useRequestForms() {
  const context = useContext(RequestFormsContext)
  if (!context) {
    throw new Error('useRequestForms must be used within RequestFormsProvider')
  }
  return context
}
