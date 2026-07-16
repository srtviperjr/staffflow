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
import { formatDisplayDate } from '../utils/staffingPlanDates'
import { computePositionCost, formatCostAmount } from '../utils/positionCost'

interface StaffingDetailDialogProps {
  request: StaffingPlanRequest | null
  onClose: () => void
  canReview?: boolean
  showCost?: boolean
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

export default function StaffingDetailDialog({
  request,
  onClose,
  canReview = false,
  showCost = false,
  onApprove,
  onReject,
}: StaffingDetailDialogProps) {
  const showActions = Boolean(request && request.status === 'pending' && canReview)
  const positionCost = request
    ? computePositionCost(request.hoursToGo, request.hourlyCost)
    : null

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
        {request && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 1.5,
            }}
          >
            <Detail label="Phase" value={request.phase} />
            <Detail label="Location Type" value={request.locationType} />
            <Detail label="Functional Group" value={request.functionalGroup} />
            <Detail label="DSG" value={request.dsg} />
            <Detail label="Area" value={request.area} />
            <Detail label="Sub Area" value={request.subArea} />
            <Detail label="Country" value={request.country} />
            <Detail label="Discipline" value={request.discipline} />
            <Detail label="Class" value={request.class} />
            <Detail label="Company" value={request.company} />
            <Detail label="Roster" value={request.roster} />
            <Detail label="EE Id / SAP" value={request.eeIdSap} />
            <Detail label="Sort Number" value={request.sortNumber} />
            <Detail label="Total Hours" value={request.totalHours} />
            <Detail label="Hours To Go" value={request.hoursToGo} />
            {showCost ? (
              <>
                <Detail label="Hourly Cost" value={request.hourlyCost} />
                {positionCost != null ? (
                  <Detail label="Position Cost" value={formatCostAmount(positionCost)} />
                ) : null}
              </>
            ) : null}
            <Detail label="Start Bi-Week" value={formatDisplayDate(request.startBiWeek)} />
            <Detail label="Last Working Day" value={formatDisplayDate(request.lwp)} />
          </Box>
        )}
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
