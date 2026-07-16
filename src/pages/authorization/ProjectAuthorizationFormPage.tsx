import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import VerifiedIcon from '@mui/icons-material/Verified'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'
import SearchableSelect from '../../components/SearchableSelect'
import SearchableOptionSelect from '../../components/SearchableOptionSelect'
import SundayWeekDatePicker from '../../components/SundayWeekDatePicker'
import { COMPANIES, filterByCompanyVisibility } from '../../constants/companies'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useRoles } from '../../context/RolesContext'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import { CLASSES, HIRING_SOURCES, ROSTERS } from '../../constants/staffingPlanOptions'
import { COUNTRY_SUGGESTIONS } from '../../types/staffingPlan'
import type { ProjectAuthorizationFormData } from '../../types/projectAuthorization'
import {
  formatApprovedPositionLabel,
  getApprovedDsgOptions,
  getApprovedFunctionalGroups,
  getApprovedPositionOptions,
  getApprovedStaffingRequests,
} from '../../utils/approvedPositions'
import { requestToFormData, staffingPlanToFormData } from '../../utils/projectAuthorizationRevisions'
import { validateBiWeekDate, validateLwpDate } from '../../utils/staffingPlanDates'

function createEmptyForm(
  company: ProjectAuthorizationFormData['company'] = '',
): ProjectAuthorizationFormData {
  return {
    staffingPlanRequestId: '',
    functionalGroup: '',
    dsg: '',
    candidateName: '',
    country: '',
    class: '',
    hiringSource: '',
    company,
    eeIdSap: '',
    sortNumber: '',
    totalHours: '',
    roster: '',
    startBiWeek: '',
    lwp: '',
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
      {children}
    </Typography>
  )
}

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

export default function ProjectAuthorizationFormPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const positionId = searchParams.get('positionId')
  const navigate = useNavigate()
  const { currentUser } = useRoles()
  const { requests: staffingRequests } = useStaffingPlanRequests()
  const { currentRequests, addRequest, reviseRequest } = useProjectAuthorizationRequests()
  const [form, setForm] = useState<ProjectAuthorizationFormData>(() =>
    createEmptyForm(currentUser?.company ?? ''),
  )
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectAuthorizationFormData, string>>>(
    {},
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const visiblePafRequests = useMemo(
    () => filterByCompanyVisibility(currentRequests, currentUser?.company),
    [currentRequests, currentUser?.company],
  )

  const revisionSource = useMemo(
    () => visiblePafRequests.find((request) => request.id === requestId),
    [visiblePafRequests, requestId],
  )
  const isRevisionMode = Boolean(requestId && revisionSource)
  const invalidRevisionId = Boolean(requestId && !revisionSource)
  const companyLocked = Boolean(currentUser && currentUser.company !== 'BHP')

  const visibleStaffingRequests = useMemo(
    () => filterByCompanyVisibility(staffingRequests, currentUser?.company),
    [staffingRequests, currentUser?.company],
  )

  const approvedRequests = useMemo(
    () => getApprovedStaffingRequests(visibleStaffingRequests),
    [visibleStaffingRequests],
  )

  const prefillPosition = useMemo(
    () => approvedRequests.find((request) => request.id === positionId),
    [approvedRequests, positionId],
  )

  useEffect(() => {
    if (revisionSource) {
      setForm(requestToFormData(revisionSource))
      setErrors({})
      return
    }

    if (prefillPosition) {
      setForm(staffingPlanToFormData(prefillPosition))
      setErrors({})
      return
    }

    if (!currentUser?.company) return

    setForm((prev) => {
      if (currentUser.company !== 'BHP') {
        return prev.company === currentUser.company
          ? prev
          : { ...prev, company: currentUser.company }
      }
      return prev.company ? prev : { ...prev, company: currentUser.company }
    })
  }, [revisionSource, prefillPosition, currentUser?.company])

  const functionalGroupOptions = useMemo(
    () => getApprovedFunctionalGroups(visibleStaffingRequests),
    [visibleStaffingRequests],
  )

  const dsgOptions = useMemo(
    () => getApprovedDsgOptions(visibleStaffingRequests, form.functionalGroup),
    [visibleStaffingRequests, form.functionalGroup],
  )

  const approvedPositionOptions = useMemo(
    () => getApprovedPositionOptions(visibleStaffingRequests, form.functionalGroup, form.dsg),
    [visibleStaffingRequests, form.functionalGroup, form.dsg],
  )

  const updateField = <K extends keyof ProjectAuthorizationFormData>(
    field: K,
    value: ProjectAuthorizationFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleFunctionalGroupChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      functionalGroup: value,
      dsg: '',
      staffingPlanRequestId: '',
    }))
    setErrors((prev) => ({ ...prev, functionalGroup: undefined, dsg: undefined, staffingPlanRequestId: undefined }))
  }

  const handleDsgChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      dsg: value,
      staffingPlanRequestId: '',
    }))
    setErrors((prev) => ({ ...prev, dsg: undefined, staffingPlanRequestId: undefined }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof ProjectAuthorizationFormData, string>> = {}

    if (!form.functionalGroup) nextErrors.functionalGroup = 'Functional group is required'
    if (!form.dsg.trim()) nextErrors.dsg = 'DSG is required'
    if (!form.staffingPlanRequestId) nextErrors.staffingPlanRequestId = 'Approved position is required'
    if (!form.candidateName.trim()) nextErrors.candidateName = 'Candidate name is required'
    if (!form.country.trim()) nextErrors.country = 'Country is required'
    if (!form.class) nextErrors.class = 'Class is required'
    if (!form.hiringSource) nextErrors.hiringSource = 'Hiring source is required'
    if (!form.company) nextErrors.company = 'Company is required'
    if (!form.roster) nextErrors.roster = 'Roster is required'

    const biWeekError = validateBiWeekDate(form.startBiWeek)
    if (biWeekError) nextErrors.startBiWeek = biWeekError

    const lwpError = validateLwpDate(form.lwp)
    if (lwpError) nextErrors.lwp = lwpError

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const selectedPosition = approvedRequests.find(
      (request) => request.id === form.staffingPlanRequestId,
    )
    if (!selectedPosition) return

    const positionLabel = formatApprovedPositionLabel(selectedPosition)
    const position = selectedPosition.position

    if (isRevisionMode && revisionSource) {
      reviseRequest(revisionSource.id, form, positionLabel, position)
      setSuccessMessage(
        `Revision ${revisionSource.revision + 1} submitted for ${revisionSource.candidateName} (PAF ${revisionSource.pafNumber}).`,
      )
      navigate('/project-authorization')
    } else {
      const created = addRequest(form, positionLabel, position)
      setSuccessMessage(
        `PAF approval submitted successfully. PAF: ${created.pafNumber}.`,
      )
      setForm(createEmptyForm(currentUser?.company ?? ''))
    }

    setShowSuccess(true)
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <VerifiedIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                {isRevisionMode ? 'Revise PAF Approval' : 'PAF Approval Request'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isRevisionMode
                  ? `Creating revision ${revisionSource!.revision + 1} from revision ${revisionSource!.revision}. Each update is saved as a new revision for review.`
                  : 'Submit a PAF approval for a candidate against an approved staffing plan position'}
              </Typography>
            </Box>
          </Box>

          {invalidRevisionId && (
            <Alert severity="error" sx={{ mb: 2 }}>
              The PAF approval could not be found. It may have been superseded by a newer
              revision.{' '}
              <Button component={RouterLink} to="/project-authorization" size="small">
                Back to requests
              </Button>
            </Alert>
          )}

          {isRevisionMode && (
            <Alert severity="info" icon={<HistoryIcon />} sx={{ mb: 2 }}>
              You are revising <strong>{revisionSource!.candidateName}</strong> (
              {revisionSource!.approvedPositionLabel}). Submitting will create revision{' '}
              <strong>{revisionSource!.revision + 1}</strong> and send it for manager review.
            </Alert>
          )}

          {prefillPosition && !isRevisionMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Creating a PAF approval for approved position{' '}
              <strong>{formatApprovedPositionLabel(prefillPosition)}</strong>. Position details
              have been prefilled from the staffing plan.
            </Alert>
          )}

          {approvedRequests.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No approved staffing plan positions are available yet. Approve a staffing plan
              request before submitting a PAF approval.
            </Alert>
          )}

          <Divider sx={{ mb: 4 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <SectionTitle>Approved Position Selection</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Functional Group"
                  options={functionalGroupOptions}
                  value={form.functionalGroup}
                  onChange={handleFunctionalGroupChange}
                  required
                  error={errors.functionalGroup}
                  helperText="From approved staffing plan positions"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="DSG"
                  options={dsgOptions}
                  value={form.dsg}
                  onChange={handleDsgChange}
                  required
                  error={errors.dsg}
                  helperText={
                    form.functionalGroup
                      ? 'Filtered by functional group'
                      : 'Select a functional group first'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableOptionSelect
                  label="Approved Position"
                  options={approvedPositionOptions}
                  value={form.staffingPlanRequestId}
                  onChange={(value) => updateField('staffingPlanRequestId', value)}
                  required
                  error={errors.staffingPlanRequestId}
                  disabled={!form.functionalGroup || !form.dsg}
                  helperText={
                    form.functionalGroup && form.dsg
                      ? 'Select an approved position'
                      : 'Select functional group and DSG first'
                  }
                />
              </Grid>
            </Grid>

            <SectionTitle>Candidate Details</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Candidate Name"
                  value={form.candidateName}
                  onChange={(e) => updateField('candidateName', e.target.value)}
                  error={Boolean(errors.candidateName)}
                  helperText={errors.candidateName}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Country"
                  options={COUNTRY_SUGGESTIONS}
                  value={form.country}
                  onChange={(value) => updateField('country', value)}
                  freeSolo
                  required
                  error={errors.country}
                  helperText="Search, select, or type a country"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Class"
                  options={CLASSES}
                  value={form.class}
                  onChange={(value) => updateField('class', value)}
                  required
                  error={errors.class}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Hiring Source"
                  options={HIRING_SOURCES}
                  value={form.hiringSource}
                  onChange={(value) => updateField('hiringSource', value)}
                  required
                  error={errors.hiringSource}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Company"
                  options={COMPANIES}
                  value={form.company}
                  onChange={(value) =>
                    updateField('company', value as ProjectAuthorizationFormData['company'])
                  }
                  required
                  error={errors.company}
                  disabled={companyLocked}
                  helperText={
                    companyLocked
                      ? 'Defaults to your company designation'
                      : 'BHP can submit for any company'
                  }
                />
              </Grid>
            </Grid>

            <SectionTitle>Identifiers &amp; Hours</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="EE Id # / SAP"
                  value={form.eeIdSap}
                  onChange={(e) => updateField('eeIdSap', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Sort Number"
                  value={form.sortNumber}
                  onChange={(e) => updateField('sortNumber', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Hours"
                  value={form.totalHours}
                  onChange={(e) => updateField('totalHours', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <SectionTitle>Schedule</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Roster"
                  options={ROSTERS}
                  value={form.roster}
                  onChange={(value) => updateField('roster', value)}
                  required
                  error={errors.roster}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SundayWeekDatePicker
                  label="Start Bi-Week"
                  value={form.startBiWeek}
                  onChange={(value) => updateField('startBiWeek', value)}
                  mode="biweekly"
                  error={errors.startBiWeek}
                  helperText="Bi-weekly Sunday start date"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SundayWeekDatePicker
                  label="LWP"
                  value={form.lwp}
                  onChange={(value) => updateField('lwp', value)}
                  mode="weekly"
                  error={errors.lwp}
                  helperText="Weekly Sunday date"
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 4, flexWrap: 'wrap' }}>
              {isRevisionMode && (
                <Button component={RouterLink} to="/project-authorization" variant="outlined">
                  Cancel Revision
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={isRevisionMode ? <EditIcon /> : <SendIcon />}
                disabled={approvedRequests.length === 0 || invalidRevisionId}
              >
                {isRevisionMode ? `Submit Revision ${revisionSource!.revision + 1}` : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!isRevisionMode && visiblePafRequests.length > 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <SectionTitle>Submitted Requests</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Revise an existing request to create a new revision for manager review.
            </Typography>
            <Stack spacing={2}>
              {visiblePafRequests.map((request) => (
                <Box
                  key={request.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    flexWrap: 'wrap',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1">{request.candidateName}</Typography>
                      <Chip label={`PAF ${request.pafNumber}`} size="small" color="info" variant="outlined" />
                      <Chip label={`Rev ${request.revision}`} size="small" variant="outlined" />
                      <Chip label={request.company} size="small" variant="outlined" />
                      <Chip
                        label={request.status}
                        size="small"
                        color={statusColor(request.status)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {request.approvedPositionLabel}
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={`/project-authorization/revise/${request.id}`}
                    variant="outlined"
                    startIcon={<EditIcon />}
                  >
                    Revise
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={showSuccess}
        autoHideDuration={5000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  )
}
