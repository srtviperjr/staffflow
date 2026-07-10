import { useState } from 'react'
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
import AssignmentIcon from '@mui/icons-material/Assignment'
import SearchableSelect from '../../components/SearchableSelect'
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

export default function StaffingPlanFormPage() {
  const { addRequest } = useStaffingPlanRequests()
  const [form, setForm] = useState<StaffingPlanFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof StaffingPlanFormData, string>>>({})
  const [showSuccess, setShowSuccess] = useState(false)

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
    addRequest(form)
    setForm(initialForm)
    setShowSuccess(true)
  }

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AssignmentIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Staffing Plan Position Request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a new position request for the staffing plan
              </Typography>
            </Box>
          </Box>

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
              <Button type="submit" variant="contained" size="large" startIcon={<SendIcon />}>
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
          Position request submitted successfully.
        </Alert>
      </Snackbar>
    </>
  )
}
