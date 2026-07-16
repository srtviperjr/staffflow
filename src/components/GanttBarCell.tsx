import { Box, TableCell } from '@mui/material'
import {
  ganttBarRadius,
  ganttBarRole,
  personBarColor,
} from '../utils/ganttPeriods'
import { formatDisplayDate } from '../utils/staffingPlanDates'

const cellSx = {
  border: '1px solid #bdbdbd',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap' as const,
  py: 0.5,
  px: 0.75,
}

type GanttBarCellProps = {
  period: string
  periods: string[]
  startBiWeek: string
  lwp: string
  color?: string
  colorSeed?: string
  title?: string
  minWidth?: number
  emptyBgcolor?: string
}

export default function GanttBarCell({
  period,
  periods,
  startBiWeek,
  lwp,
  color,
  colorSeed,
  title,
  minWidth = 28,
  emptyBgcolor = 'rgba(0,0,0,0.02)',
}: GanttBarCellProps) {
  const role = ganttBarRole(period, periods, startBiWeek, lwp)
  if (role === 'none') {
    return (
      <TableCell
        sx={{
          ...cellSx,
          minWidth,
          maxWidth: minWidth,
          p: 0,
          bgcolor: emptyBgcolor,
        }}
      />
    )
  }

  const barColor = color ?? personBarColor(colorSeed ?? title ?? startBiWeek)

  return (
    <TableCell
      sx={{
        ...cellSx,
        minWidth,
        maxWidth: minWidth,
        p: 0.25,
        borderLeft: role === 'middle' || role === 'end' ? 'none' : undefined,
        borderRight: role === 'middle' || role === 'start' ? 'none' : undefined,
      }}
    >
      <Box
        sx={{
          height: 18,
          bgcolor: barColor,
          borderRadius: ganttBarRadius(role),
          opacity: 0.92,
        }}
        title={title}
      />
    </TableCell>
  )
}

/**
 * Calendar cell for a staffing position:
 * - slate bar spans the position duration
 * - coloured person bars span each PAF's own start → last working day
 */
export function MultiPersonGanttCell({
  period,
  periods,
  people,
  positionRange,
  minWidth = 58,
}: {
  period: string
  periods: string[]
  people: Array<{
    id: string
    candidateName: string
    startBiWeek: string
    lwp: string
    color: string
  }>
  /** Staffing position availability window (separate from each person's PAF duration). */
  positionRange?: { startBiWeek: string; lwp: string }
  minWidth?: number
}) {
  const covering = people.filter(
    (person) => ganttBarRole(period, periods, person.startBiWeek, person.lwp) !== 'none',
  )
  const positionRole = positionRange
    ? ganttBarRole(period, periods, positionRange.startBiWeek, positionRange.lwp)
    : 'none'
  const inPositionWindow = positionRole !== 'none'

  if (covering.length === 0 && !inPositionWindow) {
    return (
      <TableCell
        sx={{
          ...cellSx,
          minWidth,
          p: 0,
          bgcolor: 'rgba(0,0,0,0.02)',
        }}
      />
    )
  }

  return (
    <TableCell
      sx={{
        ...cellSx,
        minWidth,
        p: 0.25,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {inPositionWindow ? (
          <Box
            sx={{
              height: covering.length > 0 ? 5 : 18,
              bgcolor: '#64748b',
              borderRadius: ganttBarRadius(positionRole),
              opacity: covering.length > 0 ? 0.45 : 0.8,
            }}
            title={`Position: ${formatDisplayDate(positionRange!.startBiWeek)} → ${formatDisplayDate(positionRange!.lwp)}`}
          />
        ) : null}
        {covering.map((person) => {
          const role = ganttBarRole(period, periods, person.startBiWeek, person.lwp)
          return (
            <Box
              key={person.id}
              sx={{
                height: covering.length > 1 || inPositionWindow ? 10 : 18,
                bgcolor: person.color,
                borderRadius: ganttBarRadius(role),
                opacity: 0.92,
              }}
              title={`${person.candidateName}: ${formatDisplayDate(person.startBiWeek)} → ${formatDisplayDate(person.lwp)}`}
            />
          )
        })}
      </Box>
    </TableCell>
  )
}
