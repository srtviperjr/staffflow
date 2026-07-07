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
  requesterName: string
  onClose: () => void
  onConfirm: (comment: string) => void
}

export default function RejectDialog({
  open,
  requesterName,
  onClose,
  onConfirm,
}: RejectDialogProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleClose = () => {
    setComment('')
    setError('')
    onClose()
  }

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('A comment is required when rejecting a request')
      return
    }
    onConfirm(comment.trim())
    setComment('')
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
          You are rejecting the labour change request submitted by{' '}
          <strong>{requesterName}</strong>. Please provide a comment explaining the rejection.
        </Typography>
        <TextField
          label="Rejection Comment"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
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
