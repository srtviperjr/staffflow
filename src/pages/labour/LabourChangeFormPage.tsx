import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import DescriptionIcon from '@mui/icons-material/Description'
import { useLabourChangeRequests } from '../../context/LabourChangeContext'
import type { LabourChangeFormData } from '../../types/labourChange'

const initialForm: LabourChangeFormData = {
  requesterName: '',
  email: '',
  isUrgent: '',
  project: '',
  areaFunctionDiscipline: '',
  endorsingHeadName: '',
  organization: '',
  changeReason: '',
  roleType: '',
}

function QuestionLabel({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <FormLabel
      required
      sx={{
        display: 'block',
        color: 'primary.main',
        fontWeight: 600,
        fontSize: '1rem',
        mb: 1,
      }}
    >
      {number}. {children}
    </FormLabel>
  )
}

export default function RequestFormPage() {
  const { addRequest } = useLabourChangeRequests()
  const [form, setForm] = useState<LabourChangeFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LabourChangeFormData, string>>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const updateField = <K extends keyof LabourChangeFormData>(field: K, value: LabourChangeFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof LabourChangeFormData, string>> = {}

    if (!form.requesterName.trim()) nextErrors.requesterName = 'Name is required'
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!form.isUrgent) nextErrors.isUrgent = 'Please select an option'
    if (!form.project) nextErrors.project = 'Please select a project'
    if (!form.areaFunctionDiscipline.trim()) {
      nextErrors.areaFunctionDiscipline = 'Area, function or discipline is required'
    }
    if (!form.endorsingHeadName.trim()) {
      nextErrors.endorsingHeadName = 'Endorsing head name is required'
    }
    if (!form.organization) nextErrors.organization = 'Please select an organization'
    if (!form.changeReason.trim()) nextErrors.changeReason = 'Reason for change is required'
    if (!form.roleType) nextErrors.roleType = 'Please select an option'

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
            <DescriptionIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" color="primary">
              Labour Change Request
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
            This is a temporary solution for labour changes across projects JS1 and JS2. For
            urgent follow-ups, please contact Ebele Afamefune or Heather McMeekin directly.
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <StackField>
              <QuestionLabel number={1}>
                What is your name? Please put who is raising the request, not who the change is
                for.
              </QuestionLabel>
              <TextField
                value={form.requesterName}
                onChange={(e) => updateField('requesterName', e.target.value)}
                error={Boolean(errors.requesterName)}
                helperText={errors.requesterName}
              />
            </StackField>

            <StackField>
              <QuestionLabel number={2}>What is your email address?</QuestionLabel>
              <TextField
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </StackField>

            <StackField>
              <QuestionLabel number={3}>Is this an urgent request?</QuestionLabel>
              <FormControl error={Boolean(errors.isUrgent)}>
                <RadioGroup
                  value={form.isUrgent}
                  onChange={(e) => updateField('isUrgent', e.target.value as LabourChangeFormData['isUrgent'])}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
                {errors.isUrgent && <FormHelperText>{errors.isUrgent}</FormHelperText>}
              </FormControl>
            </StackField>

            <StackField>
              <QuestionLabel number={4}>
                Which project does this change pertain to? (please keep separate requests on
                their own form)
              </QuestionLabel>
              <FormControl error={Boolean(errors.project)}>
                <RadioGroup
                  value={form.project}
                  onChange={(e) => updateField('project', e.target.value as LabourChangeFormData['project'])}
                >
                  <FormControlLabel value="JS1" control={<Radio />} label="JS1" />
                  <FormControlLabel value="JS2" control={<Radio />} label="JS2" />
                </RadioGroup>
                {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
              </FormControl>
            </StackField>

            <StackField>
              <QuestionLabel number={5}>Area, Function or Discipline</QuestionLabel>
              <TextField
                value={form.areaFunctionDiscipline}
                onChange={(e) => updateField('areaFunctionDiscipline', e.target.value)}
                error={Boolean(errors.areaFunctionDiscipline)}
                helperText={errors.areaFunctionDiscipline}
              />
            </StackField>

            <StackField>
              <QuestionLabel number={6}>
                Please provide the name of the Head of that has endorsed this change ahead of
                submission.
              </QuestionLabel>
              <TextField
                value={form.endorsingHeadName}
                onChange={(e) => updateField('endorsingHeadName', e.target.value)}
                error={Boolean(errors.endorsingHeadName)}
                helperText={errors.endorsingHeadName}
              />
            </StackField>

            <StackField>
              <QuestionLabel number={7}>
                What organization does the role currently sit in?
              </QuestionLabel>
              <FormControl error={Boolean(errors.organization)}>
                <RadioGroup
                  value={form.organization}
                  onChange={(e) =>
                    updateField('organization', e.target.value as LabourChangeFormData['organization'])
                  }
                >
                  <FormControlLabel value="BHP" control={<Radio />} label="BHP" />
                  <FormControlLabel value="HBJV" control={<Radio />} label="HBJV" />
                </RadioGroup>
                {errors.organization && <FormHelperText>{errors.organization}</FormHelperText>}
              </FormControl>
            </StackField>

            <StackField>
              <QuestionLabel number={8}>What is the reason for this change?</QuestionLabel>
              <TextField
                value={form.changeReason}
                onChange={(e) => updateField('changeReason', e.target.value)}
                error={Boolean(errors.changeReason)}
                helperText={errors.changeReason}
                multiline
                rows={4}
              />
            </StackField>

            <StackField>
              <QuestionLabel number={9}>
                Is this related to a new role or existing role?
              </QuestionLabel>
              <FormControl error={Boolean(errors.roleType)}>
                <RadioGroup
                  value={form.roleType}
                  onChange={(e) => updateField('roleType', e.target.value as LabourChangeFormData['roleType'])}
                >
                  <FormControlLabel value="New" control={<Radio />} label="New" />
                  <FormControlLabel value="Existing" control={<Radio />} label="Existing" />
                </RadioGroup>
                {errors.roleType && <FormHelperText>{errors.roleType}</FormHelperText>}
              </FormControl>
            </StackField>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
              <Button type="submit" variant="contained" size="large" startIcon={<SendIcon />}>
                Submit
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
          Your labour change request has been submitted successfully.
        </Alert>
      </Snackbar>
    </>
  )
}

function StackField({ children }: { children: React.ReactNode }) {
  return <Box sx={{ mb: 3.5 }}>{children}</Box>
}
