import { useState } from 'react'
import {
  Alert,
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
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useRequests } from '../context/RequestContext'
import { DEPARTMENTS, ROLES, type RequestFormData } from '../types/request'

const initialForm: RequestFormData = {
  firstName: '',
  lastName: '',
  email: '',
  requestingManagerName: '',
  startDate: '',
  role: '',
  department: '',
}

export default function RequestFormPage() {
  const { addRequest } = useRequests()
  const [form, setForm] = useState<RequestFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const updateField = <K extends keyof RequestFormData>(field: K, value: RequestFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof RequestFormData, string>> = {}

    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required'
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!form.requestingManagerName.trim()) {
      nextErrors.requestingManagerName = 'Requesting manager name is required'
    }
    if (!form.startDate) nextErrors.startDate = 'Start date is required'
    if (!form.role) nextErrors.role = 'Please select a role'
    if (!form.department) nextErrors.department = 'Please select a department'

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
        <CardContent sx={{ p: { xs: 3.3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" color="primary">
                New Hire Request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a request for a new team member onboarding
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Employee Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Requesting Manager's Name"
                  value={form.requestingManagerName}
                  onChange={(e) => updateField('requestingManagerName', e.target.value)}
                  error={Boolean(errors.requestingManagerName)}
                  helperText={errors.requestingManagerName}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.role)} required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value as RequestFormData['role'])}
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth error={Boolean(errors.department)} required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={form.department}
                    onChange={(e) =>
                      updateField('department', e.target.value as RequestFormData['department'])
                    }
                  >
                    {DEPARTMENTS.map((department) => (
                      <MenuItem key={department} value={department}>
                        {department}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.department}
                    </Typography>
                  )}
                </FormControl>
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
          Request submitted successfully! A manager will review it shortly.
        </Alert>
      </Snackbar>
    </>
  )
}
