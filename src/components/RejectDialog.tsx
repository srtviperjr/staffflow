import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'

interface RejectDialogProps {
  open: boolean
  employeeName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export default function RejectDialog({
  open,
  employeeName,
  onClose,
  onConfirm,
}: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide an explanation for the rejection')
      return
    }
    onConfirm(reason.trim())
    setReason('')
    setError('')
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CancelIcon color="error" />
        Reject Request
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You are rejecting the onboarding request for{' '}
          <strong>{employeeName}</strong>. Please provide an explanation.
        </Typography>
        <TextField
          label="Rejection Explanation"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError('')
          }}
          error={Boolean(error)}
          helperText={error}
          multiline
          rows={4}
          required
          placeholder="Explain why this request is being rejected..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  )
}
