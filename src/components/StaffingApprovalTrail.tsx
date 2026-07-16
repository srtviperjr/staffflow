import { Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TimelapseIcon from '@mui/icons-material/Timelapse'
import CancelIcon from '@mui/icons-material/Cancel'
import type { StaffingApprovalStep } from '../utils/staffingApprovalSteps'

function formatWhen(value: string | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

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

function detailLine(step: StaffingApprovalStep): string {
  if (step.status === 'current') return 'Waiting for action'
  if (step.status === 'upcoming') return 'Not yet reached'

  const when = formatWhen(step.actedAt)
  const verb =
    step.action === 'reject' ? 'Rejected' : step.action === 'submit' ? 'Submitted' : 'Approved'

  if (step.actedByName && when) return `${verb} by ${step.actedByName} · ${when}`
  if (step.actedByName) return `${verb} by ${step.actedByName}`
  if (when) return `${verb} · ${when}`
  return step.status === 'rejected' ? 'Rejected' : 'Completed'
}

/** Vertical approval trail with who acted and when, for the bottom of a request. */
export default function StaffingApprovalTrail({ steps }: { steps: StaffingApprovalStep[] }) {
  if (steps.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Workflow approvals
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {steps.map((step) => {
          const color =
            step.status === 'current'
              ? 'warning.dark'
              : step.status === 'rejected'
                ? 'error.main'
                : step.status === 'done'
                  ? 'text.primary'
                  : 'text.secondary'

          return (
            <Box key={step.nodeId} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ mt: '1px' }}>
                <StepIcon status={step.status} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color }}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {detailLine(step)}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
