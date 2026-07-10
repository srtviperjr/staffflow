import { useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  formatDateInput,
  formatDisplayDate,
  getWeeksForMonth,
  isSameDay,
  isSelectableWeekSunday,
  parseDateInput,
  type WeekPickerMode,
} from '../utils/staffingPlanDates'

interface SundayWeekDatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  mode: WeekPickerMode
  error?: string
  helperText?: string
  required?: boolean
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SundayWeekDatePicker({
  label,
  value,
  onChange,
  mode,
  error,
  helperText,
  required,
}: SundayWeekDatePickerProps) {
  const selectedDate = parseDateInput(value)
  const initialView = selectedDate ?? new Date()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())

  const weeks = useMemo(() => getWeeksForMonth(viewYear, viewMonth), [viewYear, viewMonth])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear())
      setViewMonth(selectedDate.getMonth())
    }
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const handleSelectSunday = (sunday: Date) => {
    if (!isSelectableWeekSunday(sunday, mode)) return
    onChange(formatDateInput(sunday))
    handleClose()
  }

  const defaultHelperText =
    mode === 'biweekly'
      ? 'Select a highlighted bi-weekly Sunday'
      : 'Select a highlighted weekly Sunday'

  return (
    <>
      <TextField
        label={label}
        value={value ? formatDisplayDate(value) : ''}
        onClick={handleOpen}
        error={Boolean(error)}
        helperText={error ?? helperText ?? defaultHelperText}
        required={required}
        fullWidth
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: <CalendarMonthIcon color="action" sx={{ mr: 0.5 }} />,
            sx: { cursor: 'pointer' },
          },
          inputLabel: { shrink: true },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { p: 2, width: 320, maxWidth: '100%' },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton size="small" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 0.5,
          }}
        >
          {WEEKDAY_LABELS.map((day) => (
            <Typography
              key={day}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', fontWeight: 600 }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {weeks.map((week) => {
            const sunday = week[0]
            const selectable = isSelectableWeekSunday(sunday, mode)
            const selected = selectedDate ? isSameDay(sunday, selectedDate) : false
            const inCurrentMonth = sunday.getMonth() === viewMonth

            return (
              <Box
                key={formatDateInput(sunday)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 0.5,
                  borderRadius: 1,
                  bgcolor: selectable ? 'rgba(220, 118, 51, 0.08)' : 'transparent',
                  outline: selectable ? '1px solid' : 'none',
                  outlineColor: selectable ? 'rgba(220, 118, 51, 0.22)' : 'transparent',
                  opacity: inCurrentMonth || selectable ? 1 : 0.55,
                }}
              >
                {week.map((day) => {
                  const isSunday = day.getDay() === 0
                  const isCurrentMonthDay = day.getMonth() === viewMonth
                  const canSelect = isSunday && selectable

                  return (
                    <Box
                      key={formatDateInput(day)}
                      onClick={canSelect ? () => handleSelectSunday(day) : undefined}
                      sx={{
                        textAlign: 'center',
                        py: 0.75,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: isSunday ? 600 : 400,
                        bgcolor:
                          selected && selectedDate && isSameDay(day, selectedDate)
                            ? 'primary.main'
                            : 'transparent',
                        color:
                          selected && selectedDate && isSameDay(day, selectedDate)
                            ? 'primary.contrastText'
                            : isCurrentMonthDay
                              ? 'text.primary'
                              : 'text.disabled',
                        cursor: canSelect ? 'pointer' : 'default',
                        '&:hover': canSelect
                          ? {
                              bgcolor:
                                selected && selectedDate && isSameDay(day, selectedDate)
                                  ? 'primary.dark'
                                  : 'primary.100',
                            }
                          : undefined,
                      }}
                    >
                      {day.getDate()}
                    </Box>
                  )
                })}
              </Box>
            )
          })}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {mode === 'biweekly'
            ? 'Highlighted rows are valid bi-weekly periods. Click the Sunday to select.'
            : 'Highlighted rows are valid weekly periods. Click the Sunday to select.'}
        </Typography>
      </Popover>
    </>
  )
}
