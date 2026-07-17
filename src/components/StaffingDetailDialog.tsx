import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import type { StaffingApprovalStep } from '../utils/staffingApprovalSteps'
import {
  getChangedFieldKeys,
  getPreviousRevision,
  STAFFING_PLAN_COMPARE_FIELDS,
} from '../utils/revisionDiff'
import StaffingApprovalSteps from './StaffingApprovalSteps'
import StaffingApprovalTrail from './StaffingApprovalTrail'
import { RevisionChangesLegend } from './ChangedFieldDetail'
import StaffingRevisionDetails from './StaffingRevisionDetails'

interface StaffingDetailDialogProps {
  request: StaffingPlanRequest | null
  /** Full revision history for the request group (newest-first), used for change highlighting. */
  revisionHistory?: StaffingPlanRequest[]
  onClose: () => void
  canReview?: boolean
  showCost?: boolean
  approvalSteps?: StaffingApprovalStep[]
  onApprove?: () => void
  onReject?: () => void
}

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

export default function StaffingDetailDialog({
  request,
  revisionHistory = [],
  onClose,
  canReview = false,
  showCost = false,
  approvalSteps = [],
  onApprove,
  onReject,
}: StaffingDetailDialogProps) {
  const showActions = Boolean(request && request.status === 'pending' && canReview)
  const previous =
    request && revisionHistory.length > 0
      ? getPreviousRevision(revisionHistory, request)
      : undefined
  const changedFields =
    request != null
      ? getChangedFieldKeys(request, previous, STAFFING_PLAN_COMPARE_FIELDS)
      : new Set<string>()

  return (
    <Dialog open={Boolean(request)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <AssignmentIcon color="primary" />
        {request?.position}
        {request ? (
          <>
            <Chip size="small" label={`Position ${request.positionNumber}`} variant="outlined" />
            <Chip size="small" label={`Rev ${request.revision}`} variant="outlined" />
            <Chip size="small" label={request.status} color={statusColor(request.status)} />
          </>
        ) : null}
      </DialogTitle>
      <DialogContent>
        {approvalSteps.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <StaffingApprovalSteps steps={approvalSteps} />
          </Box>
        ) : null}
        {request ? (
          <>
            <RevisionChangesLegend visible={request.revision > 1 && changedFields.size > 0} />
            <StaffingRevisionDetails
              request={request}
              previous={previous}
              changedFields={changedFields}
              showCost={showCost}
              showTimestamps={false}
            />
          </>
        ) : null}
        {approvalSteps.length > 0 ? (
          <>
            <Divider sx={{ my: 2 }} />
            <StaffingApprovalTrail steps={approvalSteps} />
          </>
        ) : null}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Submitted {request ? new Date(request.submittedAt).toLocaleString() : ''}
          {request?.reviewedAt
            ? ` · Reviewed ${new Date(request.reviewedAt).toLocaleString()}`
            : ''}
        </Typography>
        {request?.rejectionComment ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Rejection: {request.rejectionComment}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        {showActions ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={onReject}
            >
              Reject
            </Button>
          </Stack>
        ) : (
          <span />
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
