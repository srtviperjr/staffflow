import { Box } from '@mui/material'
import { ChangedFieldDetail } from './ChangedFieldDetail'
import type { StaffingPlanRequest } from '../types/staffingPlan'
import { formatDisplayDate } from '../utils/staffingPlanDates'
import {
  computePositionCost,
  formatCostAmount,
  formatCostDelta,
  formatCostWithDelta,
  formatHoursDelta,
} from '../utils/positionCost'

function formatTimestamp(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StaffingRevisionDetailsProps {
  request: StaffingPlanRequest
  previous?: StaffingPlanRequest
  changedFields?: Set<string>
  showCost: boolean
  /** When false, omit submitted/reviewed timestamps (dialog footer already shows them). */
  showTimestamps?: boolean
}

/** Field grid with revision change highlighting — shared by approval review and View dialog. */
export default function StaffingRevisionDetails({
  request,
  previous,
  changedFields,
  showCost,
  showTimestamps = true,
}: StaffingRevisionDetailsProps) {
  const changed = (field: string) => changedFields?.has(field) ?? false

  const hourly = formatCostWithDelta(request.hourlyCost, previous?.hourlyCost)
  const currentPositionCost = computePositionCost(request.hoursToGo, request.hourlyCost)
  const previousPositionCost = previous
    ? computePositionCost(previous.hoursToGo, previous.hourlyCost)
    : null
  const positionCostChanged =
    currentPositionCost != null &&
    previousPositionCost != null &&
    currentPositionCost !== previousPositionCost
  const totalHoursChanged = changed('totalHours')
  const hoursChanged = changed('hoursToGo')
  const rateChanged = changed('hourlyCost')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 1.5,
      }}
    >
      <ChangedFieldDetail label="Position Number" value={request.positionNumber} />
      <ChangedFieldDetail label="Phase" value={request.phase} changed={changed('phase')} />
      <ChangedFieldDetail label="Area" value={request.area} changed={changed('area')} />
      <ChangedFieldDetail label="Sub Area" value={request.subArea} changed={changed('subArea')} />
      <ChangedFieldDetail
        label="Location Type"
        value={request.locationType}
        changed={changed('locationType')}
      />
      <ChangedFieldDetail
        label="Functional Group"
        value={request.functionalGroup}
        changed={changed('functionalGroup')}
      />
      <ChangedFieldDetail label="DSG" value={request.dsg} changed={changed('dsg')} />
      <ChangedFieldDetail label="Country" value={request.country} changed={changed('country')} />
      <ChangedFieldDetail
        label="Discipline"
        value={request.discipline}
        changed={changed('discipline')}
      />
      <ChangedFieldDetail
        label="Position"
        value={request.position}
        changed={changed('position')}
      />
      <ChangedFieldDetail label="Class" value={request.class} changed={changed('class')} />
      <ChangedFieldDetail
        label="Company"
        value={request.company}
        changed={changed('company')}
      />
      <ChangedFieldDetail label="Roster" value={request.roster} changed={changed('roster')} />
      <ChangedFieldDetail label="EE Id / SAP" value={request.eeIdSap} changed={changed('eeIdSap')} />
      <ChangedFieldDetail
        label="Sort Number"
        value={request.sortNumber}
        changed={changed('sortNumber')}
      />
      <ChangedFieldDetail
        label="Total Hours"
        value={request.totalHours}
        changed={totalHoursChanged}
        previousValue={totalHoursChanged ? previous?.totalHours : undefined}
        delta={
          totalHoursChanged
            ? formatHoursDelta(request.totalHours, previous?.totalHours)
            : undefined
        }
      />
      <ChangedFieldDetail
        label="Hours To Go"
        value={request.hoursToGo}
        changed={hoursChanged}
        previousValue={hoursChanged ? previous?.hoursToGo : undefined}
        delta={
          hoursChanged ? formatHoursDelta(request.hoursToGo, previous?.hoursToGo) : undefined
        }
      />
      {showCost ? (
        <>
          <ChangedFieldDetail
            label="Hourly Cost"
            value={hourly.display}
            changed={rateChanged}
            previousValue={rateChanged ? hourly.previousDisplay : undefined}
            delta={rateChanged ? hourly.delta : undefined}
          />
          {currentPositionCost != null ? (
            <ChangedFieldDetail
              label="Total Cost"
              value={formatCostAmount(currentPositionCost)}
              changed={positionCostChanged}
              previousValue={
                positionCostChanged ? formatCostAmount(previousPositionCost) : undefined
              }
              delta={
                positionCostChanged
                  ? formatCostDelta(currentPositionCost, previousPositionCost)
                  : undefined
              }
            />
          ) : null}
        </>
      ) : null}
      <ChangedFieldDetail
        label="Start Bi-Week"
        value={formatDisplayDate(request.startBiWeek)}
        changed={changed('startBiWeek')}
      />
      <ChangedFieldDetail
        label="Last Working Day"
        value={formatDisplayDate(request.lwp)}
        changed={changed('lwp')}
      />
      {showTimestamps ? (
        <>
          <ChangedFieldDetail label="Submitted" value={formatTimestamp(request.submittedAt)} />
          {request.reviewedAt ? (
            <ChangedFieldDetail label="Reviewed" value={formatTimestamp(request.reviewedAt)} />
          ) : null}
        </>
      ) : null}
    </Box>
  )
}
