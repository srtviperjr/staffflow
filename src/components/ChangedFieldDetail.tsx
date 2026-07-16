import { Box, Typography } from '@mui/material'

interface ChangedFieldDetailProps {
  label: string
  value: string
  changed?: boolean
}

export function ChangedFieldDetail({ label, value, changed = false }: ChangedFieldDetailProps) {
  return (
    <Box
      sx={
        changed
          ? {
              bgcolor: 'rgba(211, 84, 0, 0.14)',
              borderRadius: 1,
              px: 1,
              py: 0.75,
              border: '1px solid',
              borderColor: 'primary.main',
            }
          : undefined
      }
    >
      <Typography variant="body2" sx={{ fontWeight: changed ? 600 : 400 }}>
        <strong>{label}:</strong> {value || '—'}
      </Typography>
    </Box>
  )
}

export function RevisionChangesLegend({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
      Highlighted fields changed from the previous revision.
    </Typography>
  )
}
