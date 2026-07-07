import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

interface ThankYouDialogProps {
  open: boolean
  onClose: () => void
}

export default function ThankYouDialog({ open, onClose }: ThankYouDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h5" component="div">
          Thank You!
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Your request has been submitted.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
