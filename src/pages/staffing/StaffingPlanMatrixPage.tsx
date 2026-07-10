import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import TableChartIcon from '@mui/icons-material/TableChart'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import {
  METADATA_COLUMNS,
  buildStaffingMatrixRows,
  buildSummaryRows,
  getMatrixPeriods,
  getRowMetadataValues,
} from '../../utils/staffingPlanMatrix'

const cellSx = {
  border: '1px solid #bdbdbd',
  fontSize: '0.75rem',
  px: 1,
  py: 0.75,
  whiteSpace: 'nowrap',
}

const stickyMetaSx = {
  ...cellSx,
  position: 'sticky' as const,
  left: 0,
  zIndex: 2,
  bgcolor: 'background.paper',
  minWidth: 110,
}

const periodHeaderSx = {
  ...cellSx,
  minWidth: 58,
  maxWidth: 58,
  textAlign: 'center' as const,
  verticalAlign: 'bottom' as const,
  height: 96,
  p: 0.5,
}

const rotatedLabelSx = {
  writingMode: 'vertical-rl' as const,
  transform: 'rotate(180deg)',
  fontSize: '0.7rem',
  fontWeight: 600,
  lineHeight: 1.1,
}

function formatPeriodLabel(period: string) {
  return period
}

function formatLoad(value: number | null | undefined) {
  if (value == null) return ''
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export default function StaffingPlanMatrixPage() {
  const { requests: staffingRequests } = useStaffingPlanRequests()
  const { requests: authorizationRequests } = useProjectAuthorizationRequests()

  const periods = useMemo(() => getMatrixPeriods(), [])
  const rows = useMemo(
    () => buildStaffingMatrixRows(staffingRequests, authorizationRequests, periods),
    [staffingRequests, authorizationRequests, periods],
  )
  const summaryRows = useMemo(() => buildSummaryRows(periods), [periods])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <TableChartIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" color="primary">
            Staffing Plan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approved positions and authorized candidates with bi-weekly full-time load
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {rows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No approved positions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approve position requests and project authorizations to populate the staffing plan
                matrix.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: '75vh', overflow: 'auto', border: '1px solid #bdbdbd' }}>
              <Table size="small" stickyHeader sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  {summaryRows.map((summary) => (
                    <TableRow key={summary.label}>
                      <TableCell
                        colSpan={METADATA_COLUMNS.length}
                        sx={{
                          ...stickyMetaSx,
                          left: 0,
                          zIndex: 4,
                          bgcolor: '#e53935',
                          color: 'white',
                          fontWeight: 700,
                        }}
                      >
                        {summary.label}
                      </TableCell>
                      {periods.map((period) => (
                        <TableCell
                          key={`${summary.label}-${period}`}
                          align="center"
                          sx={{
                            ...cellSx,
                            bgcolor: '#e53935',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: 58,
                          }}
                        >
                          {summary.values[period]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  <TableRow>
                    {METADATA_COLUMNS.map((column, index) => (
                      <TableCell
                        key={column}
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          left: index === 0 ? 0 : undefined,
                          zIndex: 3,
                          bgcolor: '#9e9e9e',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: index === 7 || index === 8 ? 140 : 110,
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                    {periods.map((period) => (
                      <TableCell key={period} sx={{ ...periodHeaderSx, bgcolor: '#9e9e9e', color: 'white' }}>
                        <Box sx={rotatedLabelSx}>{formatPeriodLabel(period)}</Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      {getRowMetadataValues(row).map((value, index) => (
                        <TableCell
                          key={`${row.id}-${METADATA_COLUMNS[index]}`}
                          sx={{
                            ...cellSx,
                            position: index === 0 ? 'sticky' : undefined,
                            left: index === 0 ? 0 : undefined,
                            zIndex: index === 0 ? 1 : undefined,
                            bgcolor: index === 0 ? 'background.paper' : undefined,
                            fontWeight: index === 8 && row.candidate !== 'Vacant' ? 600 : 400,
                          }}
                        >
                          {value}
                        </TableCell>
                      ))}
                      {periods.map((period) => (
                        <TableCell
                          key={`${row.id}-${period}`}
                          align="center"
                          sx={{
                            ...cellSx,
                            bgcolor: row.loads[period] != null ? 'rgba(21, 101, 192, 0.06)' : undefined,
                            fontWeight: row.loads[period] != null ? 600 : 400,
                            color: row.loads[period] != null ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {formatLoad(row.loads[period])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
