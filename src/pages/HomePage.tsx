import { Link as RouterLink } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VerifiedIcon from '@mui/icons-material/Verified'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ScienceIcon from '@mui/icons-material/Science'
import TableChartIcon from '@mui/icons-material/TableChart'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import { APP_SEED_VERSION_KEY } from '../data/seedVersion'
import { ensureLatestSeedData } from '../data/seedAppData'
import { useRoles } from '../context/RolesContext'
import { useStaffingPlanRequests } from '../context/StaffingPlanContext'
import { useProjectAuthorizationRequests } from '../context/ProjectAuthorizationContext'
import { useWorkflows } from '../context/WorkflowContext'
import {
  canReviewRequests,
  canSubmitRequests,
  canViewStaffingMatrix,
  isAdmin,
} from '../utils/permissions'
import { getPendingApprovalsForUser } from '../utils/pendingApprovals'

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HomePage() {
  const { currentUser, currentUserRoles } = useRoles()
  const { currentRequests: staffingRequests } = useStaffingPlanRequests()
  const { currentRequests: pafRequests } = useProjectAuthorizationRequests()
  const { getWorkflow } = useWorkflows()

  const admin = isAdmin(currentUserRoles)
  const canSubmit = canSubmitRequests(currentUserRoles)
  const canReview = canReviewRequests(currentUserRoles)
  const canViewMatrix = canViewStaffingMatrix(currentUserRoles)

  const pendingApprovals = useMemo(
    () =>
      getPendingApprovalsForUser({
        staffingRequests,
        pafRequests,
        roles: currentUserRoles,
        company: currentUser?.company,
        getWorkflow,
      }),
    [staffingRequests, pafRequests, currentUserRoles, currentUser?.company, getWorkflow],
  )

  const handleLoadSampleData = () => {
    localStorage.removeItem(APP_SEED_VERSION_KEY)
    ensureLatestSeedData()
    window.location.reload()
  }

  const availableWorkflows = [
    canSubmit
      ? {
          key: 'staffing',
          title: 'Position Request',
          description: 'Submit a staffing plan position for manager approval.',
          icon: <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />,
          color: 'primary' as const,
          primary: { label: 'Start request', to: '/staffing-plan' },
          secondary: canViewMatrix
            ? { label: 'View staffing plan', to: '/staffing-plan/matrix' }
            : undefined,
        }
      : null,
    canSubmit
      ? {
          key: 'paf',
          title: 'PAF Request',
          description: 'Submit a PAF request for a candidate against an approved staffing position.',
          icon: <VerifiedIcon color="secondary" sx={{ fontSize: 40 }} />,
          color: 'secondary' as const,
          primary: { label: 'Start request', to: '/project-authorization' },
          secondary: undefined,
        }
      : null,
    !canSubmit && canViewMatrix
      ? {
          key: 'matrix',
          title: 'Staffing Plan',
          description: 'View approved positions and bi-weekly staffing load.',
          icon: <TableChartIcon color="primary" sx={{ fontSize: 40 }} />,
          color: 'primary' as const,
          primary: { label: 'Open staffing plan', to: '/staffing-plan/matrix' },
          secondary: undefined,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    title: string
    description: string
    icon: React.ReactNode
    color: 'primary' | 'secondary'
    primary: { label: string; to: string }
    secondary?: { label: string; to: string }
  }>

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flexWrap: 'wrap',
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 0.5 }}>
            Jansen Workflows
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentUser
              ? `Welcome, ${currentUser.name} (${currentUser.company})`
              : 'Select a user to get started.'}
          </Typography>
        </Box>
        {admin ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ScienceIcon />}
            onClick={handleLoadSampleData}
          >
            Load Sample Data
          </Button>
        ) : null}
      </Box>

      <Typography variant="h5" color="primary" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>
        Available workflows
      </Typography>
      {availableWorkflows.length === 0 ? (
        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No request workflows are available for your roles.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Contact an administrator if you need access to submit or review requests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {availableWorkflows.map((workflow) => (
            <Grid key={workflow.key} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    {workflow.icon}
                    <Typography variant="h5" color={workflow.color}>
                      {workflow.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {workflow.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    component={RouterLink}
                    to={workflow.primary.to}
                    variant="contained"
                    color={workflow.color}
                    endIcon={<ArrowForwardIcon />}
                  >
                    {workflow.primary.label}
                  </Button>
                  {workflow.secondary ? (
                    <Button
                      component={RouterLink}
                      to={workflow.secondary.to}
                      variant="outlined"
                      color={workflow.color}
                    >
                      {workflow.secondary.label}
                    </Button>
                  ) : null}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <PendingActionsIcon color="warning" />
        <Box>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            Pending your approval
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Requests waiting on a workflow step assigned to your roles
          </Typography>
        </Box>
      </Box>

      {!canReview && pendingApprovals.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You do not have an approval role, so there are no items awaiting your review.
            </Typography>
          </CardContent>
        </Card>
      ) : pendingApprovals.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <PendingActionsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              No requests are currently pending your approval.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {pendingApprovals.map((item) => (
            <Card key={`${item.kind}-${item.id}`} variant="outlined">
              <CardContent
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography variant="h6">{item.title}</Typography>
                    <Chip
                      size="small"
                      color={item.kind === 'staffing-plan' ? 'primary' : 'secondary'}
                      label={item.kind === 'staffing-plan' ? 'Position Request' : 'PAF'}
                      variant="outlined"
                    />
                    <Chip size="small" label={item.company} variant="outlined" />
                    <Chip size="small" color="warning" label="Pending" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.subtitle}
                  </Typography>
                  {item.workflowStepLabel ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Waiting at: {item.workflowStepLabel}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Submitted {formatSubmittedAt(item.submittedAt)}
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to={item.reviewPath}
                  variant="contained"
                  startIcon={<ManageAccountsIcon />}
                >
                  Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
