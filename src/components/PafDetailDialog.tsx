import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { ProjectAuthorizationRequest } from '../types/projectAuthorization'
import { formatDisplayDate } from '../utils/staffingPlanDates'

interface PafDetailDialogProps {
  authorization: ProjectAuthorizationRequest | null
  onClose: () => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2">
      <strong>{label}:</strong> {value || '—'}
    </Typography>
  )
}

export default function PafDetailDialog({ authorization, onClose }: PafDetailDialogProps) {
  return (
    <Dialog open={Boolean(authorization)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedIcon color="primary" />
        PAF {authorization?.pafNumber}
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
            <Detail label="Hiring Source" value={authorization.hiringSource} />
            <Detail label="Roster" value={authorization.roster} />
            <Detail label="EE Id / SAP" value={authorization.eeIdSap} />
            <Detail label="Sort Number" value={authorization.sortNumber} />
            <Detail label="Total Hours" value={authorization.totalHours} />
            <Detail label="Start Bi-Week" value={formatDisplayDate(authorization.startBiWeek)} />
            <Detail label="LWP" value={formatDisplayDate(authorization.lwp)} />
            <Detail label="Revision" value={String(authorization.revision)} />
            <Detail label="Status" value={authorization.status} />
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Submitted {authorization ? new Date(authorization.submittedAt).toLocaleString() : ''}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
