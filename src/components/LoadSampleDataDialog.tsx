import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ScienceIcon from '@mui/icons-material/Science'
import {
  applySampleDataLoad,
  DEFAULT_HOURLY_COST_MAX,
  DEFAULT_HOURLY_COST_MIN,
  HOURLY_COST_SLIDER_MAX,
  HOURLY_COST_SLIDER_MIN,
  type SampleDataMode,
} from '../data/sampleData'
import { COMPANIES } from '../constants/companies'

type LoadSampleDataDialogProps = {
  open: boolean
  onClose: () => void
}

const MIN_RECORDS = 4
const MAX_RECORDS = 500
const DEFAULT_RECORDS = 80
const DEFAULT_POSITION_PERCENT = 60

function formatDollar(value: number) {
  return `$${value}`
}

export default function LoadSampleDataDialog({ open, onClose }: LoadSampleDataDialogProps) {
  const [mode, setMode] = useState<SampleDataMode>('replace')
  const [recordCount, setRecordCount] = useState(String(DEFAULT_RECORDS))
  const [positionPercent, setPositionPercent] = useState(DEFAULT_POSITION_PERCENT)
  const [hourlyCostRange, setHourlyCostRange] = useState<number[]>([
    DEFAULT_HOURLY_COST_MIN,
    DEFAULT_HOURLY_COST_MAX,
  ])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const parsedCount = Number(recordCount)
  const countValid =
    Number.isFinite(parsedCount) &&
    Number.isInteger(parsedCount) &&
    parsedCount >= MIN_RECORDS &&
    parsedCount <= MAX_RECORDS

  const [hourlyCostMin, hourlyCostMax] = hourlyCostRange
  const costRangeValid =
    Number.isFinite(hourlyCostMin) &&
    Number.isFinite(hourlyCostMax) &&
    hourlyCostMin <= hourlyCostMax

  const preview = useMemo(() => {
    if (!countValid) return null
    const positions = Math.round(parsedCount * (positionPercent / 100))
    const pafs = parsedCount - positions
    const perCompany = Math.max(1, Math.round(parsedCount / COMPANIES.length))
    return { positions, pafs, perCompany }
  }, [countValid, parsedCount, positionPercent])

  const handleGenerate = () => {
    setError(null)
    if (!countValid) {
      setError(`Enter a whole number between ${MIN_RECORDS} and ${MAX_RECORDS}.`)
      return
    }
    if (!costRangeValid) {
      setError('Hourly cost minimum must be less than or equal to the maximum.')
      return
    }

    setBusy(true)
    try {
      applySampleDataLoad({
        mode,
        recordCount: parsedCount,
        positionRatio: positionPercent / 100,
        hourlyCostMin,
        hourlyCostMax,
      })
      window.location.reload()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Unable to generate sample data.')
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          pr: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: 0.25 }}>
          <ScienceIcon color="primary" />
          <Typography component="span" variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            Load Sample Data
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} edge="end" size="small" disabled={busy}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Generated data follows application rules: one PAF number belongs to one person
            (revisions change details or duration, not the person); positions may be filled by
            different people over time without overlapping dates; PAFs only attach to approved
            positions.
          </Typography>

          <FormControl>
            <FormLabel id="sample-data-mode-label">Existing data</FormLabel>
            <RadioGroup
              aria-labelledby="sample-data-mode-label"
              value={mode}
              onChange={(event) => setMode(event.target.value as SampleDataMode)}
            >
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label="Clear all position and PAF requests first, then generate"
              />
              <FormControlLabel
                value="append"
                control={<Radio />}
                label="Add to the existing dataset"
              />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Number of records to create"
            type="number"
            value={recordCount}
            onChange={(event) => setRecordCount(event.target.value)}
            slotProps={{
              htmlInput: { min: MIN_RECORDS, max: MAX_RECORDS, step: 1 },
            }}
            helperText={`Whole number from ${MIN_RECORDS} to ${MAX_RECORDS}. Spread across ${COMPANIES.join(', ')}.`}
            error={Boolean(recordCount) && !countValid}
            fullWidth
          />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mix: {positionPercent}% positions / {100 - positionPercent}% PAFs
            </Typography>
            <Slider
              value={positionPercent}
              onChange={(_, value) => setPositionPercent(value as number)}
              min={20}
              max={80}
              step={5}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}% positions`}
              marks={[
                { value: 20, label: 'More PAFs' },
                { value: 50, label: '50/50' },
                { value: 80, label: 'More positions' },
              ]}
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hourly cost range for positions: {formatDollar(hourlyCostMin)} –{' '}
              {formatDollar(hourlyCostMax)}
            </Typography>
            <Slider
              value={hourlyCostRange}
              onChange={(_, value) => setHourlyCostRange(value as number[])}
              min={HOURLY_COST_SLIDER_MIN}
              max={HOURLY_COST_SLIDER_MAX}
              step={5}
              disableSwap
              valueLabelDisplay="auto"
              valueLabelFormat={formatDollar}
              marks={[
                { value: HOURLY_COST_SLIDER_MIN, label: formatDollar(HOURLY_COST_SLIDER_MIN) },
                { value: 100, label: '$100' },
                { value: HOURLY_COST_SLIDER_MAX, label: formatDollar(HOURLY_COST_SLIDER_MAX) },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              Positions awaiting Cost Engineer entry stay blank; others get a rate in this range.
            </Typography>
          </Box>

          {preview ? (
            <Alert severity="info" variant="outlined">
              About <strong>{preview.positions}</strong> position groups and{' '}
              <strong>{preview.pafs}</strong> PAF numbers (~{preview.perCompany} records per
              company). Position hourly costs will fall between{' '}
              <strong>{formatDollar(hourlyCostMin)}</strong> and{' '}
              <strong>{formatDollar(hourlyCostMax)}</strong>.
            </Alert>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={busy || !countValid || !costRangeValid}
          startIcon={<ScienceIcon />}
        >
          {busy ? 'Generating…' : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
