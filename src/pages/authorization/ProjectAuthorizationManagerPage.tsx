import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import RejectDialog from '../../components/RejectDialog'
import type { ProjectAuthorizationRequest } from '../../types/projectAuthorization'
import { formatDisplayDate } from '../../utils/staffingPlanDates'

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

function StatusChip({ status }: { status: ProjectAuthorizationRequest['status'] }) {
  const config = {
    pending: { label: 'Pending Review', color: 'warning' as const },
    approved: { label: 'Approved', color: 'success' as const },
    rejected: { label: 'Rejected', color: 'error' as const },
  }
  const { label, color } = config[status]
  return <Chip label={label} color={color} size="small" />
}

function formatTimestamp(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2">
      <strong>{label}:</strong> {value || '—'}
    </Typography>
  )
}

export default function ProjectAuthorizationManagerPage() {
  const { requests, rejectRequest, approveRequest } = useProjectAuthorizationRequests()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [rejectTarget, setRejectTarget] = useState<ProjectAuthorizationRequest | null>(null)

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter((request) => request.status === filter)
  }, [filter, requests])

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }),
    [requests],
  )

  const handleReject = (comment: string) => {
    if (!rejectTarget) return
    rejectRequest(rejectTarget.id, comment)
    setRejectTarget(null)
  }

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ManageAccountsIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Project Authorization Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review project authorization requests and update their status
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={filter}
            onChange={(_, value: FilterTab) => setFilter(value)}
            sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${counts.all})`} value="all" />
            <Tab label={`Pending (${counts.pending})`} value="pending" />
            <Tab label={`Approved (${counts.approved})`} value="approved" />
            <Tab label={`Rejected (${counts.rejected})`} value="rejected" />
          </Tabs>

          {filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PendingActionsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No requests found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'all'
                  ? 'Submitted project authorization requests will appear here for review.'
                  : `No ${filter} requests at this time.`}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {filteredRequests.map((request) => (
                <Card key={request.id} variant="outlined" sx={{ boxShadow: 'none' }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="h6">{request.candidateName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.approvedPositionLabel}
                        </Typography>
                      </Box>
                      <StatusChip status={request.status} />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 1.5,
                      }}
                    >
                      <Detail label="Functional Group" value={request.functionalGroup} />
                      <Detail label="DSG" value={request.dsg} />
                      <Detail label="Position" value={request.position} />
                      <Detail label="Country" value={request.country} />
                      <Detail label="Class" value={request.class} />
                      <Detail label="Hiring Source" value={request.hiringSource} />
                      <Detail label="Roster" value={request.roster} />
                      <Detail label="EE Id / SAP" value={request.eeIdSap} />
                      <Detail label="Sort Number" value={request.sortNumber} />
                      <Detail label="Total Hours" value={request.totalHours} />
                      <Detail label="Hours To Go" value={request.hoursToGo} />
                      <Detail label="Start Bi-Week" value={formatDisplayDate(request.startBiWeek)} />
                      <Detail label="LWP" value={formatDisplayDate(request.lwp)} />
                      <Detail label="Submitted" value={formatTimestamp(request.submittedAt)} />
                      {request.reviewedAt && (
                        <Detail label="Reviewed" value={formatTimestamp(request.reviewedAt)} />
                      )}
                    </Box>

                    {request.status === 'rejected' && request.rejectionComment && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'error.50',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'error.light',
                        }}
                      >
                        <Typography variant="subtitle2" color="error.main">
                          Rejection Comment
                        </Typography>
                        <Typography variant="body2">{request.rejectionComment}</Typography>
                      </Box>
                    )}
                  </CardContent>

                  {request.status === 'pending' && (
                    <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => approveRequest(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setRejectTarget(request)}
                      >
                        Reject
                      </Button>
                    </CardActions>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <RejectDialog
        open={Boolean(rejectTarget)}
        message={
          <>
            You are rejecting the project authorization request for{' '}
            <strong>{rejectTarget?.candidateName ?? ''}</strong> (
            {rejectTarget?.approvedPositionLabel}). Please provide a comment explaining the
            rejection.
          </>
        }
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </>
  )
}
