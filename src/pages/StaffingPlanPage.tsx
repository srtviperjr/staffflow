import { useMemo, useState } from 'react'
import {
  Box,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import TableChartIcon from '@mui/icons-material/TableChart'
import { useOnboardingRequests } from '../context/OnboardingContext'
import { useLabourChangeRequests } from '../context/LabourChangeContext'
import type { OnboardingRequest } from '../types/onboarding'
import type { LabourChangeRequest } from '../types/labourChange'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

interface StaffingPlanRow {
  id: string
  workflow: 'Onboarding' | 'Labour Change'
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  project: string
  organization: string
  areaOrDepartment: string
  role: string
  managerOrHead: string
  urgent: string
  startDate: string
  submittedAt: string
  reviewedAt: string
  notes: string
}

const excelBorder = '1px solid #b4b4b4'
const headerBg = '#217346'
const headerColor = '#ffffff'
const rowAltBg = '#f2f2f2'

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function statusLabel(status: StaffingPlanRow['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function mapOnboardingRequest(request: OnboardingRequest): StaffingPlanRow {
  return {
    id: request.id,
    workflow: 'Onboarding',
    name: `${request.firstName} ${request.lastName}`,
    email: request.email,
    status: request.status,
    project: '—',
    organization: '—',
    areaOrDepartment: request.department,
    role: request.role,
    managerOrHead: request.requestingManagerName,
    urgent: 'No',
    startDate: formatDate(request.startDate),
    submittedAt: formatDate(request.submittedAt),
    reviewedAt: request.approvalDetails
      ? formatDate(request.approvalDetails.onboardingDate)
      : '',
    notes: request.rejectionReason ?? '',
  }
}

function mapLabourRequest(request: LabourChangeRequest): StaffingPlanRow {
  return {
    id: request.id,
    workflow: 'Labour Change',
    name: request.requesterName,
    email: request.email,
    status: request.status,
    project: request.project,
    organization: request.organization,
    areaOrDepartment: request.areaFunctionDiscipline,
    role: request.roleType,
    managerOrHead: request.endorsingHeadName,
    urgent: request.isUrgent ? 'Yes' : 'No',
    startDate: '',
    submittedAt: formatDate(request.submittedAt),
    reviewedAt: request.reviewedAt ? formatDate(request.reviewedAt) : '',
    notes: request.rejectionComment ?? request.changeReason,
  }
}

const columns: { key: keyof StaffingPlanRow; label: string; minWidth: number }[] = [
  { key: 'workflow', label: 'Workflow', minWidth: 120 },
  { key: 'name', label: 'Name', minWidth: 140 },
  { key: 'email', label: 'Email', minWidth: 180 },
  { key: 'status', label: 'Approval Status', minWidth: 120 },
  { key: 'project', label: 'Project', minWidth: 80 },
  { key: 'organization', label: 'Organization', minWidth: 100 },
  { key: 'areaOrDepartment', label: 'Area / Department', minWidth: 160 },
  { key: 'role', label: 'Role / Role Type', minWidth: 130 },
  { key: 'managerOrHead', label: 'Manager / Head', minWidth: 140 },
  { key: 'urgent', label: 'Urgent', minWidth: 70 },
  { key: 'startDate', label: 'Start Date', minWidth: 100 },
  { key: 'submittedAt', label: 'Submitted', minWidth: 100 },
  { key: 'reviewedAt', label: 'Reviewed', minWidth: 100 },
  { key: 'notes', label: 'Notes', minWidth: 220 },
]

export default function StaffingPlanPage() {
  const { requests: onboardingRequests } = useOnboardingRequests()
  const { requests: labourRequests } = useLabourChangeRequests()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('approved')

  const allRows = useMemo(() => {
    type RawEntry =
      | { workflow: 'Onboarding'; request: OnboardingRequest }
      | { workflow: 'Labour Change'; request: LabourChangeRequest }

    const combined: RawEntry[] = [
      ...onboardingRequests.map((request) => ({ workflow: 'Onboarding' as const, request })),
      ...labourRequests.map((request) => ({ workflow: 'Labour Change' as const, request })),
    ]

    combined.sort(
      (a, b) =>
        new Date(b.request.submittedAt).getTime() - new Date(a.request.submittedAt).getTime(),
    )

    return combined.map((entry) =>
      entry.workflow === 'Onboarding'
        ? mapOnboardingRequest(entry.request)
        : mapLabourRequest(entry.request),
    )
  }, [onboardingRequests, labourRequests])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return allRows
    return allRows.filter((row) => row.status === statusFilter)
  }, [allRows, statusFilter])

  const counts = useMemo(
    () => ({
      all: allRows.length,
      pending: allRows.filter((r) => r.status === 'pending').length,
      approved: allRows.filter((r) => r.status === 'approved').length,
      rejected: allRows.filter((r) => r.status === 'rejected').length,
    }),
    [allRows],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TableChartIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              Staffing Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Matrix view of onboarding and labour change requests
            </Typography>
          </Box>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Approval Status</InputLabel>
          <Select
            label="Approval Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="all">All ({counts.all})</MenuItem>
            <MenuItem value="approved">Approved ({counts.approved})</MenuItem>
            <MenuItem value="pending">Pending ({counts.pending})</MenuItem>
            <MenuItem value="rejected">Rejected ({counts.rejected})</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ overflow: 'hidden', border: excelBorder, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse', minWidth: 1600 }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      minWidth: col.minWidth,
                      bgcolor: headerBg,
                      color: headerColor,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: excelBorder,
                      whiteSpace: 'nowrap',
                      py: 1,
                      px: 1.25,
                      fontFamily: '"Segoe UI", Calibri, Arial, sans-serif',
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      border: excelBorder,
                      textAlign: 'center',
                      py: 6,
                      color: 'text.secondary',
                      fontFamily: '"Segoe UI", Calibri, Arial, sans-serif',
                    }}
                  >
                    No requests match the selected approval status.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, index) => (
                  <TableRow
                    key={`${row.workflow}-${row.id}`}
                    sx={{
                      bgcolor: index % 2 === 1 ? rowAltBg : '#ffffff',
                      '&:hover': { bgcolor: '#e7f4ee' },
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        sx={{
                          border: excelBorder,
                          fontSize: '0.8rem',
                          py: 0.75,
                          px: 1.25,
                          whiteSpace: col.key === 'notes' ? 'normal' : 'nowrap',
                          maxWidth: col.key === 'notes' ? 280 : undefined,
                          fontFamily: '"Segoe UI", Calibri, Arial, sans-serif',
                          color: '#000000',
                        }}
                      >
                        {col.key === 'status' ? (
                          <Chip
                            label={statusLabel(row.status)}
                            size="small"
                            color={
                              row.status === 'approved'
                                ? 'success'
                                : row.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                            }
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.75rem', bgcolor: '#fff' }}
                          />
                        ) : (
                          row[col.key]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
        Showing {filteredRows.length} of {allRows.length} request(s)
      </Typography>
    </Box>
  )
}
