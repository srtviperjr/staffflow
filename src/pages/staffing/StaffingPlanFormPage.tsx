import { useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AssignmentIcon from '@mui/icons-material/Assignment'
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
                <FormControl fullWidth>
                  <InputLabel>Phase</InputLabel>
                  <Select
                    label="Phase"
                    value={form.phase}
                    onChange={(e) => updateField('phase', e.target.value as StaffingPlanFormData['phase'])}
                  >
                    {PHASES.map((phase) => (
                      <MenuItem key={phase} value={phase}>
                        {phase}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth error={Boolean(errors.locationType)} required>
                  <InputLabel>Location Type</InputLabel>
                  <Select
                    label="Location Type"
                    value={form.locationType}
                    onChange={(e) =>
                      updateField('locationType', e.target.value as StaffingPlanFormData['locationType'])
                    }
                  >
                    {LOCATION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.locationType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.locationType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth error={Boolean(errors.functionalGroup)} required>
                  <InputLabel>Functional Group</InputLabel>
                  <Select
                    label="Functional Group"
                    value={form.functionalGroup}
                    onChange={(e) =>
                      updateField(
                        'functionalGroup',
                        e.target.value as StaffingPlanFormData['functionalGroup'],
                      )
                    }
                  >
                    {FUNCTIONAL_GROUPS.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.functionalGroup && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.functionalGroup}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  options={[...DSG_OPTIONS]}
                  value={form.dsg || null}
                  onChange={(_, value) => updateField('dsg', value ?? '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="DSG"
                      required
                      error={Boolean(errors.dsg)}
                      helperText={errors.dsg ?? 'Search and select a DSG code'}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth error={Boolean(errors.area)} required>
                  <InputLabel>Area</InputLabel>
                  <Select
                    label="Area"
                    value={form.area}
                    onChange={(e) => updateField('area', e.target.value as StaffingPlanFormData['area'])}
                  >
                    {AREAS.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.area && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.area}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth error={Boolean(errors.subArea)} required>
                  <InputLabel>Sub Area</InputLabel>
                  <Select
                    label="Sub Area"
                    value={form.subArea}
                    onChange={(e) =>
                      updateField('subArea', e.target.value as StaffingPlanFormData['subArea'])
                    }
                  >
                    {SUB_AREAS.map((subArea) => (
                      <MenuItem key={subArea} value={subArea}>
                        {subArea}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subArea && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.subArea}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Autocomplete
                  freeSolo
                  options={COUNTRY_SUGGESTIONS}
                  value={form.country}
                  onChange={(_, value) => updateField('country', value ?? '')}
                  onInputChange={(_, value) => updateField('country', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      required
                      error={Boolean(errors.country)}
                      helperText={errors.country ?? 'Select or type a country'}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <SectionTitle>Position Details</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.discipline)} required>
                  <InputLabel>Discipline</InputLabel>
                  <Select
                    label="Discipline"
                    value={form.discipline}
                    onChange={(e) =>
                      updateField('discipline', e.target.value as StaffingPlanFormData['discipline'])
                    }
                  >
                    {DISCIPLINES.map((discipline) => (
                      <MenuItem key={discipline} value={discipline}>
                        {discipline}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.discipline && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.discipline}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={POSITION_SUGGESTIONS}
                  value={form.position}
                  onChange={(_, value) => updateField('position', value ?? '')}
                  onInputChange={(_, value) => updateField('position', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Position"
                      required
                      error={Boolean(errors.position)}
                      helperText={errors.position ?? 'Search existing or type a new position'}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.class)} required>
                  <InputLabel>Class</InputLabel>
                  <Select
                    label="Class"
                    value={form.class}
                    onChange={(e) => updateField('class', e.target.value as StaffingPlanFormData['class'])}
                  >
                    {CLASSES.map((cls) => (
                      <MenuItem key={cls} value={cls}>
                        {cls}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.class && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.class}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.hiringSource)} required>
                  <InputLabel>Hiring Source</InputLabel>
                  <Select
                    label="Hiring Source"
                    value={form.hiringSource}
                    onChange={(e) =>
                      updateField('hiringSource', e.target.value as StaffingPlanFormData['hiringSource'])
                    }
                  >
                    {HIRING_SOURCES.map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.hiringSource && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.hiringSource}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <SectionTitle>Identifiers &amp; Hours</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="EE Id # / SAP"
                  value={form.eeIdSap}
                  onChange={(e) => updateField('eeIdSap', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="PAF Status"
                  value={form.pafStatus}
                  onChange={(e) => updateField('pafStatus', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Sort Number"
                  value={form.sortNumber}
                  onChange={(e) => updateField('sortNumber', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Hours"
                  value={form.totalHours}
                  onChange={(e) => updateField('totalHours', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Hours To Go"
                  value={form.hoursToGo}
                  onChange={(e) => updateField('hoursToGo', e.target.value)}
                />
              </Grid>
            </Grid>

            <SectionTitle>Schedule</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth error={Boolean(errors.roster)} required>
                  <InputLabel>Roster</InputLabel>
                  <Select
                    label="Roster"
                    value={form.roster}
                    onChange={(e) => updateField('roster', e.target.value as StaffingPlanFormData['roster'])}
                  >
                    {ROSTERS.map((roster) => (
                      <MenuItem key={roster} value={roster}>
                        {roster}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.roster && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.roster}
                    </Typography>
                  )}
                </FormControl>
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
