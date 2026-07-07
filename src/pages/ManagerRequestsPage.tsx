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
import { useRequests } from '../context/RequestContext'
import RejectDialog from '../components/RejectDialog'
import ApprovalFormDialog from '../components/ApprovalFormDialog'
import ThankYouDialog from '../components/ThankYouDialog'
import type { ApprovalDetails, ApprovalFormData, OnboardingRequest } from '../types/request'

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

function StatusChip({ status }: { status: OnboardingRequest['status'] }) {
  const config = {
    pending: { label: 'Pending', color: 'warning' as const },
    approved: { label: 'Approved', color: 'success' as const },
    rejected: { label: 'Rejected', color: 'error' as const },
  }

  const { label, color } = config[status]
  return <Chip label={label} color={color} size="small" variant="outlined" />
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ManagerRequestsPage() {
  const { requests, rejectRequest, approveRequest } = useRequests()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [rejectTarget, setRejectTarget] = useState<OnboardingRequest | null>(null)
  const [approveTarget, setApproveTarget] = useState<OnboardingRequest | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)

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

  const handleReject = (reason: string) => {
    if (!rejectTarget) return
    rejectRequest(rejectTarget.id, reason)
    setRejectTarget(null)
  }

  const handleApprove = (data: ApprovalFormData) => {
    if (!approveTarget) return

    const details: ApprovalDetails = {
      buddyName: data.buddyName.trim(),
      buddyEmail: data.buddyEmail.trim(),
      onboardingDate: data.onboardingDate,
      machineSetup: data.machineSetup as ApprovalDetails['machineSetup'],
      applications: data.applications,
      engineeringTools: data.engineeringTools,
      procurementTools: data.procurementTools,
    }

    approveRequest(approveTarget.id, details)
    setApproveTarget(null)
    setShowThankYou(true)
  }

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ManageAccountsIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Manager Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review, approve, or reject submitted onboarding requests
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
                  ? 'Submitted requests will appear here for review.'
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
                        <Typography variant="h6">
                          {request.firstName} {request.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.email}
                        </Typography>
                      </Box>
                      <StatusChip status={request.status} />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Manager:</strong> {request.requestingManagerName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Start Date:</strong> {formatDate(request.startDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Role:</strong> {request.role}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Department:</strong> {request.department}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Submitted:</strong> {formatDate(request.submittedAt)}
                      </Typography>
                    </Box>

                    {request.status === 'rejected' && request.rejectionReason && (
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
                          Rejection Reason
                        </Typography>
                        <Typography variant="body2">{request.rejectionReason}</Typography>
                      </Box>
                    )}

                    {request.status === 'approved' && request.approvalDetails && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'success.50',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'success.light',
                        }}
                      >
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                          Onboarding Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>Buddy:</strong> {request.approvalDetails.buddyName} (
                          {request.approvalDetails.buddyEmail})
                        </Typography>
                        <Typography variant="body2">
                          <strong>Onboarding Date:</strong>{' '}
                          {formatDate(request.approvalDetails.onboardingDate)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Machine:</strong> {request.approvalDetails.machineSetup}
                        </Typography>
                        {request.approvalDetails.applications.length > 0 && (
                          <Typography variant="body2">
                            <strong>Applications:</strong>{' '}
                            {request.approvalDetails.applications.join(', ')}
                          </Typography>
                        )}
                        {request.approvalDetails.engineeringTools.length > 0 && (
                          <Typography variant="body2">
                            <strong>Engineering Tools:</strong>{' '}
                            {request.approvalDetails.engineeringTools.join(', ')}
                          </Typography>
                        )}
                        {request.approvalDetails.procurementTools.length > 0 && (
                          <Typography variant="body2">
                            <strong>Procurement Tools:</strong>{' '}
                            {request.approvalDetails.procurementTools.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>

                  {request.status === 'pending' && (
                    <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setApproveTarget(request)}
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
        employeeName={
          rejectTarget ? `${rejectTarget.firstName} ${rejectTarget.lastName}` : ''
        }
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />

      <ApprovalFormDialog
        open={Boolean(approveTarget)}
        request={approveTarget}
        onClose={() => setApproveTarget(null)}
        onSubmit={handleApprove}
      />

      <ThankYouDialog open={showThankYou} onClose={() => setShowThankYou(false)} />
    </>
  )
}
