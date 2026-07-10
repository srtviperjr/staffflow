import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import VerifiedIcon from '@mui/icons-material/Verified'
import SearchableSelect from '../../components/SearchableSelect'
import SearchableOptionSelect from '../../components/SearchableOptionSelect'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
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
import { validateBiWeekDate, validateLwpDate } from '../../utils/staffingPlanDates'

const initialForm: ProjectAuthorizationFormData = {
  staffingPlanRequestId: '',
  functionalGroup: '',
  dsg: '',
  candidateName: '',
  country: '',
  class: '',
  hiringSource: '',
  eeIdSap: '',
  pafStatus: '',
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

export default function ProjectAuthorizationFormPage() {
  const { requests: staffingRequests } = useStaffingPlanRequests()
  const { addRequest } = useProjectAuthorizationRequests()
  const [form, setForm] = useState<ProjectAuthorizationFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectAuthorizationFormData, string>>>(
    {},
  )
  const [showSuccess, setShowSuccess] = useState(false)

  const approvedRequests = useMemo(
    () => getApprovedStaffingRequests(staffingRequests),
    [staffingRequests],
  )

  const functionalGroupOptions = useMemo(
    () => getApprovedFunctionalGroups(staffingRequests),
    [staffingRequests],
  )

  const dsgOptions = useMemo(
    () => getApprovedDsgOptions(staffingRequests, form.functionalGroup),
    [staffingRequests, form.functionalGroup],
  )

  const approvedPositionOptions = useMemo(
    () => getApprovedPositionOptions(staffingRequests, form.functionalGroup, form.dsg),
    [staffingRequests, form.functionalGroup, form.dsg],
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

    addRequest(form, formatApprovedPositionLabel(selectedPosition), selectedPosition.position)
    setForm(initialForm)
    setShowSuccess(true)
  }

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <VerifiedIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Project Authorization Request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Authorize a candidate against an approved staffing plan position
              </Typography>
            </Box>
          </Box>

          {approvedRequests.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No approved staffing plan positions are available yet. Approve a staffing plan
              request before submitting a project authorization.
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="PAF Status"
                  value={form.pafStatus}
                  onChange={(e) => updateField('pafStatus', e.target.value)}
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
                  onChange={(value) => updateField('roster', value)}
                  required
                  error={errors.roster}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Start Bi-Week"
                  type="date"
                  value={form.startBiWeek}
                  onChange={(e) => updateField('startBiWeek', e.target.value)}
                  error={Boolean(errors.startBiWeek)}
                  helperText={errors.startBiWeek ?? 'Bi-weekly Sunday start date'}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="LWP"
                  type="date"
                  value={form.lwp}
                  onChange={(e) => updateField('lwp', e.target.value)}
                  error={Boolean(errors.lwp)}
                  helperText={errors.lwp ?? 'Weekly Sunday date'}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                disabled={approvedRequests.length === 0}
              >
                Submit Request
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccess}
        autoHideDuration={5000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setShowSuccess(false)}>
          Project authorization request submitted successfully.
        </Alert>
      </Snackbar>
    </>
  )
}
