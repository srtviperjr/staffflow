import { Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TimelapseIcon from '@mui/icons-material/Timelapse'
import CancelIcon from '@mui/icons-material/Cancel'
import type { StaffingApprovalStep } from '../utils/staffingApprovalSteps'

function StepIcon({ status }: { status: StaffingApprovalStep['status'] }) {
  if (status === 'done') {
    return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
  }
  if (status === 'current') {
    return <TimelapseIcon sx={{ fontSize: 18, color: 'warning.main' }} />
  }
  if (status === 'rejected') {
    return <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />
  }
  return <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
}

export default function StaffingApprovalSteps({
  steps,
  compact = false,
}: {
  steps: StaffingApprovalStep[]
  compact?: boolean
}) {
  if (steps.length === 0) return null

  return (
    <Box sx={{ mt: compact ? 0.75 : 1.5 }}>
      {!compact ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Approval steps before final approval
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.25 },
        }}
      >
        {steps.map((step, index) => {
          const emphasis =
            step.status === 'current' || step.status === 'rejected'
              ? 700
              : step.status === 'done'
                ? 600
                : 400
          const color =
            step.status === 'current'
              ? 'warning.dark'
              : step.status === 'rejected'
                ? 'error.main'
                : step.status === 'done'
                  ? 'success.dark'
                  : 'text.secondary'

          return (
            <Box key={step.nodeId} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {index > 0 ? (
                <Typography variant="caption" color="text.disabled" sx={{ mx: 0.25 }}>
                  →
                </Typography>
              ) : null}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StepIcon status={step.status} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: emphasis,
                    color,
                    maxWidth: { xs: 140, sm: 220 },
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
