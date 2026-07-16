import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

type RequestFormDialogProps = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** Wider forms (staffing / PAF) */
  maxWidth?: 'sm' | 'md' | 'lg'
}

export default function RequestFormDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'md',
}: RequestFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      scroll="paper"
      aria-labelledby="request-form-dialog-title"
    >
      <DialogTitle
        id="request-form-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          pr: 1,
          pb: subtitle ? 1 : 2,
        }}
      >
        <Typography component="span" variant="h5" color="primary" sx={{ fontWeight: 700, pt: 0.5 }}>
          {title}
        </Typography>
        <IconButton aria-label="Close" onClick={onClose} edge="end" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 1.5 }}>
          {subtitle}
        </Typography>
      ) : null}
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {children}
      </DialogContent>
    </Dialog>
  )
}
