import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
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
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
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

function RequestDetails({ request }: { request: ProjectAuthorizationRequest }) {
  return (
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
      <Detail label="Start Bi-Week" value={formatDisplayDate(request.startBiWeek)} />
      <Detail label="LWP" value={formatDisplayDate(request.lwp)} />
      <Detail label="Submitted" value={formatTimestamp(request.submittedAt)} />
      {request.reviewedAt && <Detail label="Reviewed" value={formatTimestamp(request.reviewedAt)} />}
    </Box>
  )
}

export default function ProjectAuthorizationManagerPage() {
  const { currentRequests, rejectRequest, approveRequest, getHistory } =
    useProjectAuthorizationRequests()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [rejectTarget, setRejectTarget] = useState<ProjectAuthorizationRequest | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return currentRequests
    return currentRequests.filter((request) => request.status === filter)
  }, [filter, currentRequests])

  const counts = useMemo(
    () => ({
      all: currentRequests.length,
      pending: currentRequests.filter((r) => r.status === 'pending').length,
      approved: currentRequests.filter((r) => r.status === 'approved').length,
      rejected: currentRequests.filter((r) => r.status === 'rejected').length,
    }),
    [currentRequests],
  )

  const handleReject = (comment: string) => {
    if (!rejectTarget) return
    rejectRequest(rejectTarget.id, comment)
    setRejectTarget(null)
  }

  const toggleHistory = (revisionGroupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [revisionGroupId]: !prev[revisionGroupId],
    }))
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
                Review current revisions of project authorization requests
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
              {filteredRequests.map((request) => {
                const history = getHistory(request.revisionGroupId)
                const hasHistory = history.length > 1
                const historyOpen = expandedGroups[request.revisionGroupId] ?? false

                return (
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="h6">{request.candidateName}</Typography>
                            <Chip
                              label={`Revision ${request.revision}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {request.approvedPositionLabel}
                          </Typography>
                        </Box>
                        <StatusChip status={request.status} />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <RequestDetails request={request} />

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

                      {hasHistory && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            onClick={() => toggleHistory(request.revisionGroupId)}
                            endIcon={historyOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          >
                            {historyOpen ? 'Hide' : 'Show'} revision history ({history.length})
                          </Button>
                          <Collapse in={historyOpen}>
                            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                              {history
                                .filter((entry) => entry.id !== request.id)
                                .map((entry) => (
                                  <Box
                                    key={entry.id}
                                    sx={{
                                      p: 2,
                                      bgcolor: 'grey.50',
                                      borderRadius: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        gap: 1,
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="subtitle2">
                                        Revision {entry.revision}
                                      </Typography>
                                      <StatusChip status={entry.status} />
                                      <Typography variant="caption" color="text.secondary">
                                        Submitted {formatTimestamp(entry.submittedAt)}
                                      </Typography>
                                    </Box>
                                    <RequestDetails request={entry} />
                                  </Box>
                                ))}
                            </Stack>
                          </Collapse>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                      {request.status === 'pending' && (
                        <>
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
                        </>
                      )}
                      <Button
                        component={RouterLink}
                        to={`/project-authorization/revise/${request.id}`}
                        variant="outlined"
                        startIcon={<EditIcon />}
                      >
                        Revise
                      </Button>
                    </CardActions>
                  </Card>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <RejectDialog
        open={Boolean(rejectTarget)}
        message={
          <>
            You are rejecting revision {rejectTarget?.revision ?? ''} of the project authorization
            request for <strong>{rejectTarget?.candidateName ?? ''}</strong> (
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
