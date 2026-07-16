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
import VerifiedIcon from '@mui/icons-material/Verified'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import { formatDisplayDate } from '../utils/staffingPlanDates'

interface PafDetailDialogProps {
  authorization: ProjectAuthorizationRequest | null
  onClose: () => void
  canReview?: boolean
  onApprove?: () => void
  onReject?: () => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2">
      <strong>{label}:</strong> {value || '—'}
    </Typography>
  )
}

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

export default function PafDetailDialog({
  authorization,
  onClose,
  canReview = false,
  onApprove,
  onReject,
}: PafDetailDialogProps) {
  const showActions = Boolean(
    authorization && authorization.status === 'pending' && canReview,
  )

  return (
    <Dialog open={Boolean(authorization)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <VerifiedIcon color="primary" />
        PAF {authorization?.pafNumber}
        {authorization ? (
          <>
            <Chip size="small" label={`Rev ${authorization.revision}`} variant="outlined" />
            <Chip
              size="small"
              label={authorization.status}
              color={statusColor(authorization.status)}
            />
          </>
        ) : null}
      </DialogTitle>
      <DialogContent>
        {authorization && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            <Detail label="Candidate" value={authorization.candidateName} />
            <Detail label="Position" value={authorization.position} />
            <Detail label="Approved Position" value={authorization.approvedPositionLabel} />
            <Detail label="Functional Group" value={authorization.functionalGroup} />
            <Detail label="DSG" value={authorization.dsg} />
            <Detail label="Country" value={authorization.country} />
            <Detail label="Class" value={authorization.class} />
            <Detail label="Company" value={authorization.company} />
            <Detail label="Roster" value={authorization.roster} />
            <Detail label="EE Id / SAP" value={authorization.eeIdSap} />
            <Detail label="Sort Number" value={authorization.sortNumber} />
            <Detail label="Total Hours" value={authorization.totalHours} />
            <Detail label="Start Bi-Week" value={formatDisplayDate(authorization.startBiWeek)} />
            <Detail label="Last Working Day" value={formatDisplayDate(authorization.lwp)} />
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Submitted {authorization ? new Date(authorization.submittedAt).toLocaleString() : ''}
          {authorization?.reviewedAt
            ? ` · Reviewed ${new Date(authorization.reviewedAt).toLocaleString()}`
            : ''}
        </Typography>
        {authorization?.rejectionComment ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Rejection: {authorization.rejectionComment}
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
