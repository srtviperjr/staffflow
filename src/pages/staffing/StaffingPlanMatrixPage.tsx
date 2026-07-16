import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Popover,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import TableChartIcon from '@mui/icons-material/TableChart'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PafDetailDialog from '../../components/PafDetailDialog'
import StaffingDetailDialog from '../../components/StaffingDetailDialog'
import RejectDialog from '../../components/RejectDialog'
import { filterByCompanyVisibility } from '../../constants/companies'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useRoles } from '../../context/RolesContext'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import { canReviewRequests, canSubmitRequests } from '../../utils/permissions'
import {
  getRelatedItemsForStaffingPosition,
  type RelatedRegisterItem,
} from '../../utils/relatedRegisterItems'
import type { ProjectAuthorizationRequest } from '../../types/projectAuthorization'
import type { StaffingPlanRequest } from '../../types/staffingPlan'
import {
  DEFAULT_COLUMN_ORDER,
  MATRIX_COLUMN_DEFS,
  buildStaffingMatrixRows,
  buildSummaryRows,
  filterMatrixRows,
  getMatrixPeriods,
  getOrderedVisibleColumns,
  getUniqueColumnValues,
  type MatrixColumnId,
  type StaffingMatrixRow,
} from '../../utils/staffingPlanMatrix'

const COLUMN_ORDER_KEY = 'staffing-matrix-column-order'
const COLUMN_VISIBLE_KEY = 'staffing-matrix-visible-columns'

const cellSx = {
  border: '1px solid #bdbdbd',
  fontSize: '0.75rem',
  px: 1,
  py: 0.75,
  whiteSpace: 'nowrap' as const,
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

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function loadColumnOrder(): MatrixColumnId[] {
  try {
    const stored = localStorage.getItem(COLUMN_ORDER_KEY)
    if (!stored) return [...DEFAULT_COLUMN_ORDER]
    const parsed = JSON.parse(stored) as MatrixColumnId[]
    if (!Array.isArray(parsed)) return [...DEFAULT_COLUMN_ORDER]
    const known = new Set(DEFAULT_COLUMN_ORDER)
    const filtered = parsed.filter((id) => known.has(id))
    for (const id of DEFAULT_COLUMN_ORDER) {
      if (!filtered.includes(id)) filtered.push(id)
    }
    return filtered
  } catch {
    return [...DEFAULT_COLUMN_ORDER]
  }
}

function loadVisibleColumns(): MatrixColumnId[] {
  try {
    const stored = localStorage.getItem(COLUMN_VISIBLE_KEY)
    if (!stored) return [...DEFAULT_COLUMN_ORDER]
    const parsed = JSON.parse(stored) as MatrixColumnId[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_COLUMN_ORDER]
    const known = new Set(DEFAULT_COLUMN_ORDER)
    return parsed.filter((id) => known.has(id))
  } catch {
    return [...DEFAULT_COLUMN_ORDER]
  }
}

function renderMetadataCell(
  row: StaffingMatrixRow,
  columnId: MatrixColumnId,
  value: string,
  onCreatePaf: (positionId: string) => void,
  onOpenPaf: (authorization: ProjectAuthorizationRequest) => void,
) {
  if (columnId !== 'candidate') {
    return value
  }

  // Only offer create when the position has no active (pending/approved) PAF.
  if (!row.authorization) {
    return (
      <Button
        variant="text"
        size="small"
        onClick={() => onCreatePaf(row.id)}
        sx={{
          textTransform: 'none',
          p: 0,
          minWidth: 0,
          fontWeight: 400,
          fontSize: '0.75rem',
          color: 'text.secondary',
          verticalAlign: 'baseline',
          '&:hover': { color: 'primary.main' },
        }}
      >
        None
      </Button>
    )
  }

  return (
    <Button
      variant="text"
      size="small"
      onClick={() => onOpenPaf(row.authorization!)}
      sx={{
        textTransform: 'none',
        p: 0,
        minWidth: 0,
        fontWeight: 600,
        fontSize: '0.75rem',
        verticalAlign: 'baseline',
      }}
    >
      {value}
    </Button>
  )
}

export default function StaffingPlanMatrixPage() {
  const navigate = useNavigate()
  const { currentUser, currentUserRoles } = useRoles()
  const {
    requests: staffingRequests,
    approveRequest: approveStaffing,
    rejectRequest: rejectStaffing,
  } = useStaffingPlanRequests()
  const {
    requests: authorizationRequests,
    approveRequest: approvePaf,
    rejectRequest: rejectPaf,
  } = useProjectAuthorizationRequests()
  const canRevise = canSubmitRequests(currentUserRoles)
  const canReview = canReviewRequests(currentUserRoles)

  const [selectedPaf, setSelectedPaf] = useState<ProjectAuthorizationRequest | null>(null)
  const [selectedStaffing, setSelectedStaffing] = useState<StaffingPlanRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<RelatedRegisterItem | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [columnOrder, setColumnOrder] = useState<MatrixColumnId[]>(loadColumnOrder)
  const [visibleColumns, setVisibleColumns] = useState<MatrixColumnId[]>(loadVisibleColumns)
  const [filters, setFilters] = useState<Partial<Record<MatrixColumnId, string>>>({})
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder))
  }, [columnOrder])

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBLE_KEY, JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const visibleStaffingRequests = useMemo(
    () => filterByCompanyVisibility(staffingRequests, currentUser?.company),
    [staffingRequests, currentUser?.company],
  )
  const visibleAuthorizationRequests = useMemo(
    () => filterByCompanyVisibility(authorizationRequests, currentUser?.company),
    [authorizationRequests, currentUser?.company],
  )

  const periods = useMemo(() => getMatrixPeriods(), [])
  const rows = useMemo(
    () => buildStaffingMatrixRows(visibleStaffingRequests, visibleAuthorizationRequests, periods),
    [visibleStaffingRequests, visibleAuthorizationRequests, periods],
  )
  const filteredRows = useMemo(() => filterMatrixRows(rows, filters), [rows, filters])
  const summaryRows = useMemo(() => buildSummaryRows(periods), [periods])
  const visibleColumnDefs = useMemo(
    () => getOrderedVisibleColumns(columnOrder, visibleColumns),
    [columnOrder, visibleColumns],
  )

  const relatedByRowId = useMemo(() => {
    const map = new Map<string, RelatedRegisterItem[]>()
    for (const row of rows) {
      const position = visibleStaffingRequests.find((request) => request.id === row.id)
      if (!position) {
        map.set(row.id, [])
        continue
      }
      map.set(
        row.id,
        getRelatedItemsForStaffingPosition(
          position,
          visibleStaffingRequests,
          visibleAuthorizationRequests,
        ),
      )
    }
    return map
  }, [rows, visibleStaffingRequests, visibleAuthorizationRequests])

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  )

  const handleCreatePaf = (positionId: string) => {
    navigate(`/project-authorization?positionId=${positionId}`)
  }

  const handleRevise = (positionId: string) => {
    navigate(`/staffing-plan/revise/${positionId}`)
  }

  const setFilterValue = (columnId: MatrixColumnId, value: string) => {
    setFilters((prev) => {
      if (!value) {
        const next = { ...prev }
        delete next[columnId]
        return next
      }
      return { ...prev, [columnId]: value }
    })
  }

  const clearFilters = () => setFilters({})

  const toggleColumnVisible = (columnId: MatrixColumnId) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== columnId)
      }
      return [...prev, columnId]
    })
  }

  const moveColumn = (columnId: MatrixColumnId, direction: -1 | 1) => {
    setColumnOrder((prev) => {
      const index = prev.indexOf(columnId)
      if (index < 0) return prev
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const resetColumns = () => {
    setColumnOrder([...DEFAULT_COLUMN_ORDER])
    setVisibleColumns([...DEFAULT_COLUMN_ORDER])
  }

  const toggleExpanded = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  const openRelatedItem = (item: RelatedRegisterItem) => {
    if (item.kind === 'staffing-plan' && item.staffingRequest) {
      setSelectedStaffing(item.staffingRequest)
      return
    }
    if (item.pafRequest) setSelectedPaf(item.pafRequest)
  }

  const handleApproveRelated = (item: RelatedRegisterItem) => {
    if (item.kind === 'staffing-plan') approveStaffing(item.id)
    else approvePaf(item.id)
    setSelectedStaffing(null)
    setSelectedPaf(null)
  }

  const handleRejectConfirm = (comment: string) => {
    if (!rejectTarget) return
    if (rejectTarget.kind === 'staffing-plan') rejectStaffing(rejectTarget.id, comment)
    else rejectPaf(rejectTarget.id, comment)
    setRejectTarget(null)
    setSelectedStaffing(null)
    setSelectedPaf(null)
  }

  const orderedColumnDefsForPanel = useMemo(
    () =>
      columnOrder
        .map((id) => MATRIX_COLUMN_DEFS.find((column) => column.id === id))
        .filter((column): column is (typeof MATRIX_COLUMN_DEFS)[number] => Boolean(column)),
    [columnOrder],
  )

  const metadataColSpan = visibleColumnDefs.length + 1 + (canRevise ? 1 : 0)

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TableChartIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" color="primary">
              Staffing Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expand rows to view revisions and pending approvals. Date columns stay fixed.
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffIcon />}
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<ViewColumnIcon />}
            onClick={(event) => setColumnsAnchor(event.currentTarget)}
          >
            Columns
          </Button>
        </Stack>
      </Box>

      <Popover
        open={Boolean(columnsAnchor)}
        anchorEl={columnsAnchor}
        onClose={() => setColumnsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 480 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Metadata columns
            </Typography>
            <Button size="small" startIcon={<RestartAltIcon />} onClick={resetColumns}>
              Reset
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Show/hide and reorder metadata fields. Bi-week date columns cannot be changed.
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List dense disablePadding>
            {orderedColumnDefsForPanel.map((column, index) => {
              const checked = visibleColumns.includes(column.id)
              return (
                <ListItem
                  key={column.id}
                  secondaryAction={
                    <Stack direction="row" spacing={0.25}>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={`Move ${column.label} up`}
                        disabled={index === 0}
                        onClick={() => moveColumn(column.id, -1)}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={`Move ${column.label} down`}
                        disabled={index === orderedColumnDefsForPanel.length - 1}
                        onClick={() => moveColumn(column.id, 1)}
                      >
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                  sx={{ pr: 10 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      onChange={() => toggleColumnVisible(column.id)}
                      slotProps={{ input: { 'aria-label': `Toggle ${column.label}` } }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={column.label} />
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Popover>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {rows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No approved positions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approve position requests to populate the staffing plan matrix. PAF requests are
                optional and can be linked later.
              </Typography>
            </Box>
          ) : filteredRows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No rows match the current filters
              </Typography>
              <Button variant="outlined" startIcon={<FilterAltOffIcon />} onClick={clearFilters} sx={{ mt: 1 }}>
                Clear Filters
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: '75vh', overflow: 'auto', border: '1px solid #bdbdbd' }}>
              <Table size="small" stickyHeader sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  {summaryRows.map((summary) => (
                    <TableRow key={summary.label}>
                      <TableCell
                        colSpan={Math.max(metadataColSpan, 1)}
                        sx={{
                          ...stickyMetaSx,
                          left: 0,
                          zIndex: 5,
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
                            zIndex: 4,
                          }}
                        >
                          {summary.values[period]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell
                      sx={{
                        ...cellSx,
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        zIndex: 6,
                        bgcolor: '#9e9e9e',
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 48,
                        width: 48,
                      }}
                    />
                    {visibleColumnDefs.map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 0,
                          zIndex: 5,
                          bgcolor: '#9e9e9e',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: column.minWidth ?? 110,
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    {canRevise ? (
                      <TableCell
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 0,
                          zIndex: 5,
                          bgcolor: '#9e9e9e',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: 96,
                        }}
                      >
                        Actions
                      </TableCell>
                    ) : null}
                    {periods.map((period) => (
                      <TableCell
                        key={period}
                        sx={{ ...periodHeaderSx, bgcolor: '#9e9e9e', color: 'white', zIndex: 4 }}
                      >
                        <Box sx={rotatedLabelSx}>{formatPeriodLabel(period)}</Box>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell
                      sx={{
                        ...cellSx,
                        position: 'sticky',
                        top: 40,
                        left: 0,
                        zIndex: 6,
                        bgcolor: '#eceff1',
                        minWidth: 48,
                      }}
                    />
                    {visibleColumnDefs.map((column) => {
                      const options = getUniqueColumnValues(rows, column.id)
                      return (
                        <TableCell
                          key={`filter-${column.id}`}
                          sx={{
                            ...cellSx,
                            position: 'sticky',
                            top: 40,
                            zIndex: 5,
                            bgcolor: '#eceff1',
                            minWidth: column.minWidth ?? 110,
                            p: 0.5,
                          }}
                        >
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`filter-${column.id}-label`} shrink={false} sx={{ display: 'none' }}>
                              {column.label}
                            </InputLabel>
                            <Select
                              labelId={`filter-${column.id}-label`}
                              displayEmpty
                              value={filters[column.id] ?? ''}
                              onChange={(event) => setFilterValue(column.id, event.target.value)}
                              sx={{
                                fontSize: '0.7rem',
                                bgcolor: 'background.paper',
                                '& .MuiSelect-select': { py: 0.5, px: 1 },
                              }}
                            >
                              <MenuItem value="">
                                <em>All</em>
                              </MenuItem>
                              {options.map((option) => (
                                <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      )
                    })}
                    {canRevise ? (
                      <TableCell
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 40,
                          zIndex: 5,
                          bgcolor: '#eceff1',
                          minWidth: 96,
                        }}
                      />
                    ) : null}
                    {periods.map((period) => (
                      <TableCell
                        key={`filter-period-${period}`}
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 40,
                          zIndex: 4,
                          bgcolor: '#eceff1',
                          minWidth: 58,
                        }}
                      />
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.map((row) => {
                    const related = relatedByRowId.get(row.id) ?? []
                    const expanded = Boolean(expandedRows[row.id])
                    return (
                      <Fragment key={row.id}>
                        <TableRow hover>
                          <TableCell
                            sx={{
                              ...cellSx,
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              bgcolor: 'background.paper',
                              minWidth: 48,
                              width: 48,
                              p: 0.25,
                            }}
                          >
                            <IconButton
                              size="small"
                              aria-label={expanded ? 'Collapse related items' : 'Expand related items'}
                              onClick={() => toggleExpanded(row.id)}
                              disabled={related.length === 0}
                            >
                              {expanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                          {visibleColumnDefs.map((column) => {
                            const value = column.getValue(row)
                            return (
                              <TableCell
                                key={`${row.id}-${column.id}`}
                                sx={{
                                  ...cellSx,
                                  minWidth: column.minWidth ?? 110,
                                }}
                              >
                                {renderMetadataCell(
                                  row,
                                  column.id,
                                  value,
                                  handleCreatePaf,
                                  setSelectedPaf,
                                )}
                              </TableCell>
                            )
                          })}
                          {canRevise ? (
                            <TableCell sx={{ ...cellSx, minWidth: 96 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleRevise(row.id)}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                              >
                                Revise
                              </Button>
                            </TableCell>
                          ) : null}
                          {periods.map((period) => (
                            <TableCell
                              key={`${row.id}-${period}`}
                              align="center"
                              sx={{
                                ...cellSx,
                                bgcolor: row.loads[period] != null ? 'rgba(211, 84, 0, 0.06)' : undefined,
                                fontWeight: row.loads[period] != null ? 600 : 400,
                                color: row.loads[period] != null ? 'primary.main' : 'text.secondary',
                              }}
                            >
                              {formatLoad(row.loads[period])}
                            </TableCell>
                          ))}
                        </TableRow>

                        {expanded
                          ? related.map((item) => (
                              <TableRow key={`${row.id}-related-${item.kind}-${item.id}`} sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableCell
                                  colSpan={metadataColSpan}
                                  sx={{ ...cellSx, bgcolor: 'rgba(245,245,245,0.9)', py: 1 }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: { xs: 'flex-start', sm: 'center' },
                                      justifyContent: 'space-between',
                                      gap: 1.5,
                                      flexWrap: 'wrap',
                                      pl: 1,
                                    }}
                                  >
                                    <Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {item.title}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label={item.kind === 'staffing-plan' ? 'Position' : 'PAF'}
                                          variant="outlined"
                                          color={item.kind === 'staffing-plan' ? 'primary' : 'secondary'}
                                        />
                                        <Chip size="small" label={`Rev ${item.revision}`} variant="outlined" />
                                        <Chip
                                          size="small"
                                          label={item.status}
                                          color={statusColor(item.status)}
                                        />
                                      </Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {item.subtitle} · Submitted{' '}
                                        {new Date(item.submittedAt).toLocaleString()}
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => openRelatedItem(item)}
                                      >
                                        View
                                      </Button>
                                      {canReview && item.status === 'pending' ? (
                                        <>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => handleApproveRelated(item)}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => setRejectTarget(item)}
                                          >
                                            Reject
                                          </Button>
                                        </>
                                      ) : null}
                                    </Stack>
                                  </Box>
                                </TableCell>
                                {periods.map((period) => (
                                  <TableCell
                                    key={`${row.id}-${item.id}-${period}`}
                                    sx={{ ...cellSx, bgcolor: 'rgba(245,245,245,0.9)' }}
                                  />
                                ))}
                              </TableRow>
                            ))
                          : null}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {rows.length > 0 && filteredRows.length > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Showing {filteredRows.length} of {rows.length} positions
              {activeFilterCount > 0
                ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`
                : ''}
              {' · '}
              {visibleColumnDefs.length} metadata columns visible
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <PafDetailDialog
        authorization={selectedPaf}
        onClose={() => setSelectedPaf(null)}
        canReview={canReview}
        onApprove={() => {
          if (!selectedPaf) return
          approvePaf(selectedPaf.id)
          setSelectedPaf(null)
        }}
        onReject={() => {
          if (!selectedPaf) return
          setRejectTarget({
            id: selectedPaf.id,
            kind: 'project-authorization',
            title: selectedPaf.candidateName,
            subtitle: `PAF ${selectedPaf.pafNumber}`,
            status: selectedPaf.status,
            revision: selectedPaf.revision,
            submittedAt: selectedPaf.submittedAt,
            pafRequest: selectedPaf,
          })
        }}
      />

      <StaffingDetailDialog
        request={selectedStaffing}
        onClose={() => setSelectedStaffing(null)}
        canReview={canReview}
        onApprove={() => {
          if (!selectedStaffing) return
          approveStaffing(selectedStaffing.id)
          setSelectedStaffing(null)
        }}
        onReject={() => {
          if (!selectedStaffing) return
          setRejectTarget({
            id: selectedStaffing.id,
            kind: 'staffing-plan',
            title: selectedStaffing.position,
            subtitle: `Position ${selectedStaffing.positionNumber}`,
            status: selectedStaffing.status,
            revision: selectedStaffing.revision,
            submittedAt: selectedStaffing.submittedAt,
            staffingRequest: selectedStaffing,
          })
        }}
      />

      <RejectDialog
        open={Boolean(rejectTarget)}
        message={
          rejectTarget
            ? `You are rejecting ${rejectTarget.subtitle} (${rejectTarget.title}).`
            : null
        }
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />
    </Box>
  )
}
