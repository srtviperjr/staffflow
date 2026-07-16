import { useLayoutEffect } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useRequestForms,
  type RequestFormKind,
} from '../context/RequestFormsContext'

type OpenRequestFormRouteProps = {
  kind: RequestFormKind
  /** Where to land after opening the dialog (keeps the user on a real page). */
  fallbackPath: string
}

/**
 * Deep-link / bookmark helper: open the request form dialog, then replace the
 * URL with a list/register page so the browser back button is not required.
 */
export default function OpenRequestFormRoute({
  kind,
  fallbackPath,
}: OpenRequestFormRouteProps) {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const { openRequestForm } = useRequestForms()
  const positionId = searchParams.get('positionId') ?? undefined

  // Layout effect runs before Navigate's navigation effect, so the dialog opens
  // even though this route immediately redirects away.
  useLayoutEffect(() => {
    openRequestForm(kind, {
      reviseRequestId: requestId,
      positionId,
    })
  }, [kind, openRequestForm, requestId, positionId])

  return <Navigate to={fallbackPath} replace />
}
