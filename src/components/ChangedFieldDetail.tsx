import { Box, Typography } from '@mui/material'

interface ChangedFieldDetailProps {
  label: string
  value: string
  changed?: boolean
  /** When set with changed, show previous → current */
  previousValue?: string
  /** Optional numeric delta label, e.g. "Δ +1,500" */
  delta?: string
}

export function ChangedFieldDetail({
  label,
  value,
  changed = false,
  previousValue,
  delta,
}: ChangedFieldDetailProps) {
  const showTransition =
    changed && previousValue != null && previousValue !== '' && previousValue !== value

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
        <strong>{label}:</strong>{' '}
        {showTransition ? (
          <>
            <Typography component="span" variant="body2" color="text.secondary">
              {previousValue}
            </Typography>
            {' → '}
            {value || '—'}
          </>
        ) : (
          value || '—'
        )}
        {changed && delta ? (
          <Typography
            component="span"
            variant="body2"
            sx={{ ml: 1, color: 'primary.dark', fontWeight: 700 }}
          >
            ({delta})
          </Typography>
        ) : null}
      </Typography>
    </Box>
  )
}

export function RevisionChangesLegend({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
      Highlighted fields changed from the previous revision. Cost changes include a delta.
    </Typography>
  )
}
