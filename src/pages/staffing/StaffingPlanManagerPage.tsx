import { useMemo, useState } from 'react'
import {
  Alert,
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
  TextField,
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
import { useRequestForms } from '../../context/RequestFormsContext'
import { useRoles } from '../../context/RolesContext'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import { useWorkflows } from '../../context/WorkflowContext'
import RejectDialog from '../../components/RejectDialog'
import { ChangedFieldDetail, RevisionChangesLegend } from '../../components/ChangedFieldDetail'
import type { StaffingPlanRequest } from '../../types/staffingPlan'
import { formatDisplayDate } from '../../utils/staffingPlanDates'
import {
  getChangedFieldKeys,
  getPreviousRevision,
  STAFFING_PLAN_COMPARE_FIELDS,
} from '../../utils/revisionDiff'
import {
  canActOnWorkflowRequest,
  isCostEngineerReviewStep,
} from '../../utils/pendingApprovals'
import { canEditHourlyCost, canViewCostInfo } from '../../utils/permissions'
import { getStaffingApprovalSteps } from '../../utils/staffingApprovalSteps'
import StaffingApprovalSteps from '../../components/StaffingApprovalSteps'
import StaffingApprovalTrail from '../../components/StaffingApprovalTrail'
import {
  computePositionCost,
  formatCostAmount,
  formatCostDelta,
  formatCostWithDelta,
} from '../../utils/positionCost'

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

function StatusChip({ status }: { status: StaffingPlanRequest['status'] }) {
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
  previous,
  changedFields,
  showCost,
}: {
  request: StaffingPlanRequest
  previous?: StaffingPlanRequest
  changedFields?: Set<string>
  showCost: boolean
}) {
  const changed = (field: string) => changedFields?.has(field) ?? false

  const hourly = formatCostWithDelta(request.hourlyCost, previous?.hourlyCost)
  const currentPositionCost = computePositionCost(request.hoursToGo, request.hourlyCost)
  const previousPositionCost = previous
    ? computePositionCost(previous.hoursToGo, previous.hourlyCost)
    : null
  const positionCostChanged =
    currentPositionCost != null &&
    previousPositionCost != null &&
    currentPositionCost !== previousPositionCost
  const hoursChanged = changed('hoursToGo')
  const rateChanged = changed('hourlyCost')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 1.5,
      }}
    >
      <ChangedFieldDetail label="Position Number" value={request.positionNumber} />
      <ChangedFieldDetail label="Phase" value={request.phase} changed={changed('phase')} />
      <ChangedFieldDetail label="Area" value={request.area} changed={changed('area')} />
      <ChangedFieldDetail label="Sub Area" value={request.subArea} changed={changed('subArea')} />
      <ChangedFieldDetail
        label="Location Type"
        value={request.locationType}
        changed={changed('locationType')}
      />
      <ChangedFieldDetail
        label="Functional Group"
        value={request.functionalGroup}
        changed={changed('functionalGroup')}
      />
      <ChangedFieldDetail label="DSG" value={request.dsg} changed={changed('dsg')} />
      <ChangedFieldDetail label="Country" value={request.country} changed={changed('country')} />
      <ChangedFieldDetail
        label="Discipline"
        value={request.discipline}
        changed={changed('discipline')}
      />
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
        label="Hours To Go"
        value={request.hoursToGo}
        changed={hoursChanged}
        previousValue={hoursChanged ? previous?.hoursToGo : undefined}
      />
      {showCost ? (
        <>
          <ChangedFieldDetail
            label="Hourly Cost"
            value={hourly.display}
            changed={rateChanged}
            previousValue={rateChanged ? hourly.previousDisplay : undefined}
            delta={rateChanged ? hourly.delta : undefined}
          />
          {currentPositionCost != null ? (
            <ChangedFieldDetail
              label="Total Cost"
              value={formatCostAmount(currentPositionCost)}
              changed={positionCostChanged}
              previousValue={
                positionCostChanged ? formatCostAmount(previousPositionCost) : undefined
              }
              delta={
                positionCostChanged
                  ? formatCostDelta(currentPositionCost, previousPositionCost)
                  : undefined
              }
            />
          ) : null}
        </>
      ) : null}
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

export default function StaffingPlanManagerPage() {
  const { currentUser, currentUserRoles } = useRoles()
  const { openRequestForm } = useRequestForms()
  const { currentRequests, rejectRequest, approveRequest, getHistory } = useStaffingPlanRequests()
  const { getWorkflow } = useWorkflows()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [rejectTarget, setRejectTarget] = useState<StaffingPlanRequest | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [draftHourlyCost, setDraftHourlyCost] = useState<Record<string, string>>({})
  const [costError, setCostError] = useState<Record<string, string>>({})

  const showCost = canViewCostInfo(currentUserRoles)
  const canEditCost = canEditHourlyCost(currentUserRoles)

  const visibleRequests = useMemo(
    () => filterByCompanyVisibility(currentRequests, currentUser?.company),
    [currentRequests, currentUser?.company],
  )

  const actionablePending = useMemo(
    () =>
      visibleRequests.filter((request) =>
        canActOnWorkflowRequest(request, currentUserRoles, getWorkflow, {
          userProject: currentUser?.project,
        }),
      ),
    [visibleRequests, currentUserRoles, getWorkflow, currentUser?.project],
  )

  const filteredRequests = useMemo(() => {
    if (filter === 'pending') return actionablePending
    if (filter === 'all') return visibleRequests
    return visibleRequests.filter((request) => request.status === filter)
  }, [filter, visibleRequests, actionablePending])

  const counts = useMemo(
    () => ({
      all: visibleRequests.length,
      pending: actionablePending.length,
      approved: visibleRequests.filter((r) => r.status === 'approved').length,
      rejected: visibleRequests.filter((r) => r.status === 'rejected').length,
    }),
    [visibleRequests, actionablePending],
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

  const handleApprove = (request: StaffingPlanRequest) => {
    const atCostStep = isCostEngineerReviewStep(request, getWorkflow)
    if (atCostStep && canEditCost) {
      const value = (draftHourlyCost[request.id] ?? request.hourlyCost ?? '').trim()
      if (!value) {
        setCostError((prev) => ({
          ...prev,
          [request.id]: 'Enter an hourly cost before approving',
        }))
        return
      }
      approveRequest(request.id, { hourlyCost: value })
      setCostError((prev) => {
        const next = { ...prev }
        delete next[request.id]
        return next
      })
      return
    }
    approveRequest(request.id)
  }

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ManageAccountsIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Position Request Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review current revisions of position requests
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
                  ? 'Submitted position requests will appear here for review.'
                  : filter === 'pending'
                    ? 'No requests are waiting on your role right now.'
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
                  STAFFING_PLAN_COMPARE_FIELDS,
                )
                const canAct = canActOnWorkflowRequest(request, currentUserRoles, getWorkflow, {
                  userProject: currentUser?.project,
                })
                const atCostStep = isCostEngineerReviewStep(request, getWorkflow)
                const hourlyDraft = draftHourlyCost[request.id] ?? request.hourlyCost ?? ''
                const draftPositionCost = computePositionCost(request.hoursToGo, hourlyDraft)
                const workflow = request.workflow
                  ? getWorkflow(request.workflow.workflowId)
                  : undefined
                const currentWorkflowNode = workflow?.nodes.find(
                  (item) => item.id === request.workflow?.currentNodeId,
                )
                const approvalSteps = getStaffingApprovalSteps({
                  workflow,
                  progress: request.workflow,
                  phase: request.phase,
                  company: request.company,
                  requestStatus: request.status,
                })

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
                            <Typography variant="h6">{request.position}</Typography>
                            <Chip
                              label={`Position ${request.positionNumber}`}
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
                            {request.phase} · {request.area} / {request.subArea}
                          </Typography>
                          {currentWorkflowNode ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Workflow: {workflow?.name} · {currentWorkflowNode.data.label}
                            </Typography>
                          ) : null}
                          <StaffingApprovalSteps steps={approvalSteps} />
                        </Box>
                        <StatusChip status={request.status} />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <RevisionChangesLegend visible={request.revision > 1} />
                      <RequestDetails
                        request={request}
                        previous={previousRevision}
                        changedFields={changedFields}
                        showCost={showCost}
                      />

                      {approvalSteps.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 2 }} />
                          <StaffingApprovalTrail steps={approvalSteps} />
                        </Box>
                      ) : null}

                      {atCostStep && canAct && canEditCost ? (
                        <Box sx={{ mt: 2, maxWidth: 360 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                            Cost Engineer entry
                          </Typography>
                          <TextField
                            label="Hourly Cost"
                            value={hourlyDraft}
                            onChange={(event) => {
                              const value = event.target.value
                              setDraftHourlyCost((prev) => ({ ...prev, [request.id]: value }))
                              setCostError((prev) => {
                                const next = { ...prev }
                                delete next[request.id]
                                return next
                              })
                            }}
                            fullWidth
                            size="small"
                            error={Boolean(costError[request.id])}
                            helperText={
                              costError[request.id] ||
                              'Required for Costing Approved'
                            }
                            slotProps={{
                              htmlInput: { inputMode: 'decimal' },
                              input: {
                                startAdornment: (
                                  <Typography component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>
                                    $
                                  </Typography>
                                ),
                              },
                            }}
                          />
                          {draftPositionCost != null ? (
                            <Typography variant="body2" sx={{ mt: 1.25 }}>
                              <strong>Total Cost:</strong> {formatCostAmount(draftPositionCost)}
                              <Typography component="span" variant="caption" color="text.secondary">
                                {' '}
                                (Hours To Go × Hourly Cost)
                              </Typography>
                            </Typography>
                          ) : null}
                        </Box>
                      ) : null}

                      {request.status === 'pending' && !canAct ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Waiting on another role before you can approve or reject this request.
                        </Alert>
                      ) : null}

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
                                    STAFFING_PLAN_COMPARE_FIELDS,
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
                                    <RequestDetails
                                      request={entry}
                                      previous={entryPrevious}
                                      changedFields={entryChangedFields}
                                      showCost={showCost}
                                    />
                                  </Box>
                                  )
                                })}
                            </Stack>
                          </Collapse>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                      {request.status === 'pending' && canAct && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApprove(request)}
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
                          openRequestForm('staffing-plan', { reviseRequestId: request.id })
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
            You are rejecting revision {rejectTarget?.revision ?? ''} of the position request for{' '}
            <strong>{rejectTarget?.position ?? ''}</strong> (Position{' '}
            {rejectTarget?.positionNumber}). Please provide a comment explaining the rejection.
          </>
        }
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </>
  )
}
