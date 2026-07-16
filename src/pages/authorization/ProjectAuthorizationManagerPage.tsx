import { useMemo, useState } from 'react'
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
import { filterByCompanyVisibility } from '../../constants/companies'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useRequestForms } from '../../context/RequestFormsContext'
import { useRoles } from '../../context/RolesContext'
import { useWorkflows } from '../../context/WorkflowContext'
import RejectDialog from '../../components/RejectDialog'
import { ChangedFieldDetail, RevisionChangesLegend } from '../../components/ChangedFieldDetail'
import type { ProjectAuthorizationRequest } from '../../types/projectAuthorization'
import { formatDisplayDate } from '../../utils/staffingPlanDates'
import {
  getChangedFieldKeys,
  getPreviousRevision,
  PAF_APPROVAL_COMPARE_FIELDS,
} from '../../utils/revisionDiff'

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

function RequestDetails({
  request,
  changedFields,
}: {
  request: ProjectAuthorizationRequest
  changedFields?: Set<string>
}) {
  const changed = (field: string) => changedFields?.has(field) ?? false

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 1.5,
      }}
    >
      <ChangedFieldDetail label="PAF" value={request.pafNumber} />
      <ChangedFieldDetail
        label="Functional Group"
        value={request.functionalGroup}
        changed={changed('functionalGroup')}
      />
      <ChangedFieldDetail label="DSG" value={request.dsg} changed={changed('dsg')} />
      <ChangedFieldDetail label="Position" value={request.position} changed={changed('position')} />
      <ChangedFieldDetail
        label="Approved Position"
        value={request.approvedPositionLabel}
        changed={changed('approvedPositionLabel')}
      />
      <ChangedFieldDetail
        label="Candidate"
        value={request.candidateName}
        changed={changed('candidateName')}
      />
      <ChangedFieldDetail label="Country" value={request.country} changed={changed('country')} />
      <ChangedFieldDetail label="Class" value={request.class} changed={changed('class')} />
      <ChangedFieldDetail
        label="Company"
        value={request.company}
        changed={changed('company')}
      />
      <ChangedFieldDetail label="Roster" value={request.roster} changed={changed('roster')} />
      <ChangedFieldDetail label="EE Id / SAP" value={request.eeIdSap} changed={changed('eeIdSap')} />
      <ChangedFieldDetail
        label="Sort Number"
        value={request.sortNumber}
        changed={changed('sortNumber')}
      />
      <ChangedFieldDetail
        label="Total Hours"
        value={request.totalHours}
        changed={changed('totalHours')}
      />
      <ChangedFieldDetail
        label="Start Bi-Week"
        value={formatDisplayDate(request.startBiWeek)}
        changed={changed('startBiWeek')}
      />
      <ChangedFieldDetail
        label="Last Working Day"
        value={formatDisplayDate(request.lwp)}
        changed={changed('lwp')}
      />
      <ChangedFieldDetail label="Submitted" value={formatTimestamp(request.submittedAt)} />
      {request.reviewedAt && (
        <ChangedFieldDetail label="Reviewed" value={formatTimestamp(request.reviewedAt)} />
      )}
    </Box>
  )
}

export default function ProjectAuthorizationManagerPage() {
  const { currentUser } = useRoles()
  const { openRequestForm } = useRequestForms()
  const { currentRequests, rejectRequest, approveRequest, getHistory } =
    useProjectAuthorizationRequests()
  const { getWorkflow } = useWorkflows()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [rejectTarget, setRejectTarget] = useState<ProjectAuthorizationRequest | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const visibleRequests = useMemo(
    () => filterByCompanyVisibility(currentRequests, currentUser?.company),
    [currentRequests, currentUser?.company],
  )

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return visibleRequests
    return visibleRequests.filter((request) => request.status === filter)
  }, [filter, visibleRequests])

  const counts = useMemo(
    () => ({
      all: visibleRequests.length,
      pending: visibleRequests.filter((r) => r.status === 'pending').length,
      approved: visibleRequests.filter((r) => r.status === 'approved').length,
      rejected: visibleRequests.filter((r) => r.status === 'rejected').length,
    }),
    [visibleRequests],
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
                PAF Requests Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review current revisions of PAF requests
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
                  ? 'Submitted PAF requests will appear here for review.'
                  : `No ${filter} requests at this time.`}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {filteredRequests.map((request) => {
                const history = getHistory(request.revisionGroupId)
                const hasHistory = history.length > 1
                const historyOpen = expandedGroups[request.revisionGroupId] ?? false
                const previousRevision = getPreviousRevision(history, request)
                const changedFields = getChangedFieldKeys(
                  request,
                  previousRevision,
                  PAF_APPROVAL_COMPARE_FIELDS,
                )

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
                              label={`PAF ${request.pafNumber}`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                            <Chip
                              label={`Revision ${request.revision}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip label={request.company} size="small" variant="outlined" />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {request.approvedPositionLabel}
                          </Typography>
                          {request.workflow && (() => {
                            const workflow = getWorkflow(request.workflow.workflowId)
                            const node = workflow?.nodes.find(
                              (item) => item.id === request.workflow?.currentNodeId,
                            )
                            return node ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Workflow: {workflow?.name} · {node.data.label}
                              </Typography>
                            ) : null
                          })()}
                        </Box>
                        <StatusChip status={request.status} />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <RevisionChangesLegend visible={request.revision > 1} />
                      <RequestDetails request={request} changedFields={changedFields} />

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
                                .map((entry) => {
                                  const entryPrevious = getPreviousRevision(history, entry)
                                  const entryChangedFields = getChangedFieldKeys(
                                    entry,
                                    entryPrevious,
                                    PAF_APPROVAL_COMPARE_FIELDS,
                                  )

                                  return (
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
                                    <RevisionChangesLegend visible={entry.revision > 1} />
                                    <RequestDetails request={entry} changedFields={entryChangedFields} />
                                  </Box>
                                  )
                                })}
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
                        onClick={() =>
                          openRequestForm('project-authorization', {
                            reviseRequestId: request.id,
                          })
                        }
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
            You are rejecting revision {rejectTarget?.revision ?? ''} of the PAF request
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
