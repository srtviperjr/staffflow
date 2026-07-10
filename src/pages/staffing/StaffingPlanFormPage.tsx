import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
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
import AssignmentIcon from '@mui/icons-material/Assignment'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'
import SearchableSelect from '../../components/SearchableSelect'
import SundayWeekDatePicker from '../../components/SundayWeekDatePicker'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import {
  AREAS,
  CLASSES,
  DISCIPLINES,
  DSG_OPTIONS,
  FUNCTIONAL_GROUPS,
  HIRING_SOURCES,
  LOCATION_TYPES,
  PHASES,
  ROSTERS,
  SUB_AREAS,
} from '../../constants/staffingPlanOptions'
import {
  COUNTRY_SUGGESTIONS,
  POSITION_SUGGESTIONS,
  type StaffingPlanFormData,
} from '../../types/staffingPlan'
import { validateBiWeekDate, validateLwpDate } from '../../utils/staffingPlanDates'
import { requestToStaffingFormData } from '../../utils/staffingPlanRevisions'

const initialForm: StaffingPlanFormData = {
  phase: 'Jansen',
  locationType: '',
  functionalGroup: '',
  dsg: '',
  area: '',
  subArea: '',
  country: '',
  discipline: '',
  position: '',
  class: '',
  hiringSource: '',
  eeIdSap: '',
  sortNumber: '',
  totalHours: '',
  hoursToGo: '',
  roster: '',
  startBiWeek: '',
  lwp: '',
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

export default function StaffingPlanFormPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { currentRequests, addRequest, reviseRequest } = useStaffingPlanRequests()
  const [form, setForm] = useState<StaffingPlanFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof StaffingPlanFormData, string>>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const revisionSource = useMemo(
    () => currentRequests.find((request) => request.id === requestId),
    [currentRequests, requestId],
  )
  const isRevisionMode = Boolean(requestId && revisionSource)
  const invalidRevisionId = Boolean(requestId && !revisionSource)

  useEffect(() => {
    if (revisionSource) {
      setForm(requestToStaffingFormData(revisionSource))
      setErrors({})
    }
  }, [revisionSource])

  const updateField = <K extends keyof StaffingPlanFormData>(
    field: K,
    value: StaffingPlanFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof StaffingPlanFormData, string>> = {}

    if (!form.locationType) nextErrors.locationType = 'Location type is required'
    if (!form.functionalGroup) nextErrors.functionalGroup = 'Functional group is required'
    if (!form.dsg.trim()) nextErrors.dsg = 'DSG is required'
    if (!form.area) nextErrors.area = 'Area is required'
    if (!form.subArea) nextErrors.subArea = 'Sub area is required'
    if (!form.country.trim()) nextErrors.country = 'Country is required'
    if (!form.discipline) nextErrors.discipline = 'Discipline is required'
    if (!form.position.trim()) nextErrors.position = 'Position is required'
    if (!form.class) nextErrors.class = 'Class is required'
    if (!form.hiringSource) nextErrors.hiringSource = 'Hiring source is required'
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

    if (isRevisionMode && revisionSource) {
      reviseRequest(revisionSource.id, form)
      setSuccessMessage(
        `Revision ${revisionSource.revision + 1} submitted for ${revisionSource.position} (Position ${revisionSource.positionNumber}).`,
      )
      navigate('/staffing-plan')
    } else {
      const created = addRequest(form)
      setSuccessMessage(`Position request submitted successfully. Position: ${created.positionNumber}.`)
      setForm(initialForm)
    }

    setShowSuccess(true)
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AssignmentIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                {isRevisionMode ? 'Revise Position Request' : 'Staffing Plan Position Request'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isRevisionMode
                  ? `Creating revision ${revisionSource!.revision + 1} from revision ${revisionSource!.revision}. Each update is saved as a new revision for review.`
                  : 'Submit a new position request for the staffing plan'}
              </Typography>
            </Box>
          </Box>

          {invalidRevisionId && (
            <Alert severity="error" sx={{ mb: 2 }}>
              The position request could not be found. It may have been superseded by a newer
              revision.{' '}
              <Button component={RouterLink} to="/staffing-plan" size="small">
                Back to requests
              </Button>
            </Alert>
          )}

          {isRevisionMode && (
            <Alert severity="info" icon={<HistoryIcon />} sx={{ mb: 2 }}>
              You are revising <strong>{revisionSource!.position}</strong> (Position{' '}
              {revisionSource!.positionNumber}). Submitting will create revision{' '}
              <strong>{revisionSource!.revision + 1}</strong> and send it for manager review.
            </Alert>
          )}

          <Divider sx={{ mb: 4 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <SectionTitle>Project &amp; Organization</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Phase"
                  options={PHASES}
                  value={form.phase}
                  onChange={(value) => updateField('phase', value as StaffingPlanFormData['phase'])}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Location Type"
                  options={LOCATION_TYPES}
                  value={form.locationType}
                  onChange={(value) =>
                    updateField('locationType', value as StaffingPlanFormData['locationType'])
                  }
                  required
                  error={errors.locationType}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Functional Group"
                  options={FUNCTIONAL_GROUPS}
                  value={form.functionalGroup}
                  onChange={(value) =>
                    updateField('functionalGroup', value as StaffingPlanFormData['functionalGroup'])
                  }
                  required
                  error={errors.functionalGroup}
                />
              </Grid>
              <Grid size={12}>
                <SearchableSelect
                  label="DSG"
                  options={DSG_OPTIONS}
                  value={form.dsg}
                  onChange={(value) => updateField('dsg', value)}
                  required
                  error={errors.dsg}
                  helperText="Search and select a DSG code"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Area"
                  options={AREAS}
                  value={form.area}
                  onChange={(value) => updateField('area', value as StaffingPlanFormData['area'])}
                  required
                  error={errors.area}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchableSelect
                  label="Sub Area"
                  options={SUB_AREAS}
                  value={form.subArea}
                  onChange={(value) => updateField('subArea', value as StaffingPlanFormData['subArea'])}
                  required
                  error={errors.subArea}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <SectionTitle>Position Details</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Discipline"
                  options={DISCIPLINES}
                  value={form.discipline}
                  onChange={(value) =>
                    updateField('discipline', value as StaffingPlanFormData['discipline'])
                  }
                  required
                  error={errors.discipline}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Position"
                  options={POSITION_SUGGESTIONS}
                  value={form.position}
                  onChange={(value) => updateField('position', value)}
                  freeSolo
                  required
                  error={errors.position}
                  helperText="Search existing or type a new position"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Class"
                  options={CLASSES}
                  value={form.class}
                  onChange={(value) => updateField('class', value as StaffingPlanFormData['class'])}
                  required
                  error={errors.class}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                  label="Hiring Source"
                  options={HIRING_SOURCES}
                  value={form.hiringSource}
                  onChange={(value) =>
                    updateField('hiringSource', value as StaffingPlanFormData['hiringSource'])
                  }
                  required
                  error={errors.hiringSource}
                />
              </Grid>
            </Grid>

            <SectionTitle>Identifiers &amp; Hours</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="EE Id # / SAP"
                  value={form.eeIdSap}
                  onChange={(e) => updateField('eeIdSap', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Sort Number"
                  value={form.sortNumber}
                  onChange={(e) => updateField('sortNumber', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Total Hours"
                  value={form.totalHours}
                  onChange={(e) => updateField('totalHours', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Hours To Go"
                  value={form.hoursToGo}
                  onChange={(e) => updateField('hoursToGo', e.target.value)}
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
                  onChange={(value) => updateField('roster', value as StaffingPlanFormData['roster'])}
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
                <Button component={RouterLink} to="/staffing-plan" variant="outlined">
                  Cancel Revision
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={isRevisionMode ? <EditIcon /> : <SendIcon />}
                disabled={invalidRevisionId}
              >
                {isRevisionMode
                  ? `Submit Revision ${revisionSource!.revision + 1}`
                  : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!isRevisionMode && currentRequests.length > 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <SectionTitle>Submitted Requests</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Revise an existing position request to create a new revision for manager review.
            </Typography>
            <Stack spacing={2}>
              {currentRequests.map((request) => (
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
                      <Typography variant="subtitle1">{request.position}</Typography>
                      <Chip
                        label={`Position ${request.positionNumber}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                      <Chip label={`Rev ${request.revision}`} size="small" variant="outlined" />
                      <Chip
                        label={request.status}
                        size="small"
                        color={statusColor(request.status)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {request.area} / {request.subArea}
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={`/staffing-plan/revise/${request.id}`}
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
