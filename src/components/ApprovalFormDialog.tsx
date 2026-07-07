import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  approvalFormDraftKey,
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from '../storage/sessionStorage'
import {
  APPLICATIONS,
  ENGINEERING_TOOLS,
  PROCUREMENT_TOOLS,
  type ApprovalFormData,
  type OnboardingRequest,
} from '../types/request'

interface ApprovalFormDialogProps {
  open: boolean
  request: OnboardingRequest | null
  onClose: () => void
  onSubmit: (data: ApprovalFormData) => void
}

const initialForm: ApprovalFormData = {
  buddyName: '',
  buddyEmail: '',
  onboardingDate: '',
  machineSetup: '',
  applications: [],
  engineeringTools: [],
  procurementTools: [],
}

export default function ApprovalFormDialog({
  open,
  request,
  onClose,
  onSubmit,
}: ApprovalFormDialogProps) {
  const [form, setForm] = useState<ApprovalFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ApprovalFormData, string>>>({})
  const draftLoadedRef = useRef(false)

  useEffect(() => {
    if (open && request) {
      setForm(getSessionItem(approvalFormDraftKey(request.id), initialForm))
      setErrors({})
      draftLoadedRef.current = true
    } else {
      draftLoadedRef.current = false
    }
  }, [open, request])

  useEffect(() => {
    if (!open || !request || !draftLoadedRef.current) return
    setSessionItem(approvalFormDraftKey(request.id), form)
  }, [form, open, request])

  const clearDraft = () => {
    if (request) {
      removeSessionItem(approvalFormDraftKey(request.id))
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = () => {
    if (!validate()) return
    clearDraft()
    onSubmit(form)
  }

  if (!request) return null

  const isEngineering = request.department === 'Engineering'
  const isProcurement = request.department === 'Procurement'

  const updateField = <K extends keyof ApprovalFormData>(
    field: K,
    value: ApprovalFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleArrayItem = <T extends string>(
    field: 'applications' | 'engineeringTools' | 'procurementTools',
    item: T,
    checked: boolean,
  ) => {
    setForm((prev) => {
      const current = prev[field] as T[]
      const updated = checked ? [...current, item] : current.filter((value) => value !== item)
      return { ...prev, [field]: updated }
    })
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof ApprovalFormData, string>> = {}

    if (!form.buddyName.trim()) nextErrors.buddyName = 'Buddy name is required'
    if (!form.buddyEmail.trim()) {
      nextErrors.buddyEmail = 'Buddy email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buddyEmail)) {
      nextErrors.buddyEmail = 'Enter a valid email address'
    }
    if (!form.onboardingDate) nextErrors.onboardingDate = 'Onboarding date is required'
    if (!form.machineSetup) nextErrors.machineSetup = 'Please select a machine setup'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon color="success" />
        Approve Request — {request.firstName} {request.lastName}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete the onboarding details for this approved request.
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Onboarding Buddy's Name"
              value={form.buddyName}
              onChange={(e) => updateField('buddyName', e.target.value)}
              error={Boolean(errors.buddyName)}
              helperText={errors.buddyName}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Onboarding Buddy's Email"
              type="email"
              value={form.buddyEmail}
              onChange={(e) => updateField('buddyEmail', e.target.value)}
              error={Boolean(errors.buddyEmail)}
              helperText={errors.buddyEmail}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Onboarding Date"
              type="date"
              value={form.onboardingDate}
              onChange={(e) => updateField('onboardingDate', e.target.value)}
              error={Boolean(errors.onboardingDate)}
              helperText={errors.onboardingDate}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>
          <Grid size={12}>
            <FormControl error={Boolean(errors.machineSetup)} required>
              <FormLabel>Machine Setup</FormLabel>
              <RadioGroup
                row
                value={form.machineSetup}
                onChange={(e) =>
                  updateField('machineSetup', e.target.value as ApprovalFormData['machineSetup'])
                }
              >
                <FormControlLabel value="Laptop" control={<Radio />} label="Laptop" />
                <FormControlLabel value="Desktop" control={<Radio />} label="Desktop" />
              </RadioGroup>
              {errors.machineSetup && (
                <Typography variant="caption" color="error">
                  {errors.machineSetup}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Application Selection
          </FormLabel>
          <FormGroup row>
            {APPLICATIONS.map((app) => (
              <FormControlLabel
                key={app}
                control={
                  <Checkbox
                    checked={form.applications.includes(app)}
                    onChange={(e) => toggleArrayItem('applications', app, e.target.checked)}
                  />
                }
                label={app}
              />
            ))}
          </FormGroup>
        </FormControl>

        {isEngineering && (
          <>
            <Divider sx={{ my: 3 }} />
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Engineering Tools
              </FormLabel>
              <FormGroup row sx={{ flexWrap: 'wrap' }}>
                {ENGINEERING_TOOLS.map((tool) => (
                  <FormControlLabel
                    key={tool}
                    control={
                      <Checkbox
                        checked={form.engineeringTools.includes(tool)}
                        onChange={(e) =>
                          toggleArrayItem('engineeringTools', tool, e.target.checked)
                        }
                      />
                    }
                    label={tool}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </>
        )}

        {isProcurement && (
          <>
            <Divider sx={{ my: 3 }} />
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Procurement Tools
              </FormLabel>
              <FormGroup row>
                {PROCUREMENT_TOOLS.map((tool) => (
                  <FormControlLabel
                    key={tool}
                    control={
                      <Checkbox
                        checked={form.procurementTools.includes(tool)}
                        onChange={(e) =>
                          toggleArrayItem('procurementTools', tool, e.target.checked)
                        }
                      />
                    }
                    label={tool}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="success">
          Submit Approval
        </Button>
      </DialogActions>
    </Dialog>
  )
}
