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
import GanttBarCell, { MultiPersonGanttCell } from '../../components/GanttBarCell'
import PafDetailDialog from '../../components/PafDetailDialog'
import StaffingDetailDialog from '../../components/StaffingDetailDialog'
import RejectDialog from '../../components/RejectDialog'
import { filterByCompanyVisibility } from '../../constants/companies'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useRoles } from '../../context/RolesContext'
import { useStaffingPlanRequests } from '../../context/StaffingPlanContext'
import { canReviewRequests, canSubmitRequests } from '../../utils/permissions'
import {
  formatRelatedItemCaption,
  getGroupedRelatedItemsForStaffingPosition,
  type RelatedRegisterItem,
  type StaffingPositionRelatedGroups,
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
const EXPAND_COL_WIDTH = 48
const ACTIONS_COL_WIDTH = 96

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

function statusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function RelatedExpandRow({
  rowId,
  item,
  periods,
  metadataColSpan,
  canReview,
  onView,
  onApprove,
  onReject,
  sectionBg,
}: {
  rowId: string
  item: RelatedRegisterItem
  periods: string[]
  metadataColSpan: number
  canReview: boolean
  onView: () => void
  onApprove: () => void
  onReject: () => void
  sectionBg: string
}) {
  return (
    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
      <TableCell colSpan={metadataColSpan} sx={{ ...cellSx, bgcolor: sectionBg, py: 1 }}>
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
              {item.barColor ? (
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '2px',
                    bgcolor: item.barColor,
                    flexShrink: 0,
                  }}
                />
              ) : null}
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
              <Chip size="small" label={item.status} color={statusColor(item.status)} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatRelatedItemCaption(item)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={onView}>
              View
            </Button>
            {canReview && item.status === 'pending' ? (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={onApprove}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={onReject}
                >
                  Reject
                </Button>
              </>
            ) : null}
          </Stack>
        </Box>
      </TableCell>
      {periods.map((period) =>
        item.startBiWeekRaw && item.lwpRaw ? (
          <GanttBarCell
            key={`${rowId}-${item.id}-${period}`}
            period={period}
            periods={periods}
            startBiWeek={item.startBiWeekRaw}
            lwp={item.lwpRaw}
            color={item.barColor}
            title={`${item.title}: ${item.startBiWeek} → ${item.lwp}`}
            minWidth={58}
            emptyBgcolor={sectionBg}
          />
        ) : (
          <TableCell key={`${rowId}-${item.id}-${period}`} sx={{ ...cellSx, bgcolor: sectionBg }} />
        ),
      )}
    </TableRow>
  )
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

  // One PAF = one person. Multiple people can fill a position if dates do not overlap.
  if (!row.authorization) {
    if (!row.canAddPaf) {
      return (
        <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
          None
        </Typography>
      )
    }
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

  const personColor = row.calendarPeople.find(
    (person) => person.id === row.authorization?.id,
  )?.color

  return (
    <Stack
      direction="row"
      spacing={0.75}
      useFlexGap
      sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}
    >
      {personColor ? (
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bgcolor: personColor,
            flexShrink: 0,
            alignSelf: 'center',
          }}
        />
      ) : null}
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
      {row.canAddPaf && (
        <Button
          variant="text"
          size="small"
          onClick={() => onCreatePaf(row.id)}
          sx={{
            textTransform: 'none',
            p: 0,
            minWidth: 0,
            fontWeight: 500,
            fontSize: '0.7rem',
            color: 'text.secondary',
            verticalAlign: 'baseline',
            '&:hover': { color: 'primary.main' },
          }}
        >
          Add
        </Button>
      )}
    </Stack>
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
    const map = new Map<string, StaffingPositionRelatedGroups>()
    for (const row of rows) {
      map.set(
        row.id,
        getGroupedRelatedItemsForStaffingPosition(
          row.positionRequest,
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

  const handleRevise = (revisionGroupId: string) => {
    const current = visibleStaffingRequests.find(
      (request) => request.revisionGroupId === revisionGroupId && request.isCurrentRevision,
    )
    navigate(`/staffing-plan/revise/${current?.id ?? revisionGroupId}`)
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
              Main rows are the latest approved position revision. Expand to see position revisions and
              related PAFs (each person) with their own durations.
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
                        minWidth: EXPAND_COL_WIDTH,
                        width: EXPAND_COL_WIDTH,
                      }}
                    />
                    {canRevise ? (
                      <TableCell
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 0,
                          left: EXPAND_COL_WIDTH,
                          zIndex: 6,
                          bgcolor: '#9e9e9e',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: ACTIONS_COL_WIDTH,
                          width: ACTIONS_COL_WIDTH,
                        }}
                      >
                        Actions
                      </TableCell>
                    ) : null}
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
                        minWidth: EXPAND_COL_WIDTH,
                        width: EXPAND_COL_WIDTH,
                      }}
                    />
                    {canRevise ? (
                      <TableCell
                        sx={{
                          ...cellSx,
                          position: 'sticky',
                          top: 40,
                          left: EXPAND_COL_WIDTH,
                          zIndex: 6,
                          bgcolor: '#eceff1',
                          minWidth: ACTIONS_COL_WIDTH,
                          width: ACTIONS_COL_WIDTH,
                        }}
                      />
                    ) : null}
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
                    const related = relatedByRowId.get(row.id) ?? {
                      positionRevisions: [],
                      relatedPafs: [],
                    }
                    const relatedCount =
                      related.positionRevisions.length + related.relatedPafs.length
                    const expanded = Boolean(expandedRows[row.id])
                    return (
                      <Fragment key={row.id}>
                        <TableRow hover>
                          <TableCell
                            sx={{
                              ...cellSx,
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,
                              bgcolor: 'background.paper',
                              minWidth: EXPAND_COL_WIDTH,
                              width: EXPAND_COL_WIDTH,
                              p: 0.25,
                            }}
                          >
                            <IconButton
                              size="small"
                              aria-label={expanded ? 'Collapse related items' : 'Expand related items'}
                              onClick={() => toggleExpanded(row.id)}
                              disabled={relatedCount === 0}
                            >
                              {expanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                          {canRevise ? (
                            <TableCell
                              sx={{
                                ...cellSx,
                                position: 'sticky',
                                left: EXPAND_COL_WIDTH,
                                zIndex: 2,
                                bgcolor: 'background.paper',
                                minWidth: ACTIONS_COL_WIDTH,
                                width: ACTIONS_COL_WIDTH,
                              }}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleRevise(row.revisionGroupId)}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                              >
                                Revise
                              </Button>
                            </TableCell>
                          ) : null}
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
                          {periods.map((period) => (
                            <MultiPersonGanttCell
                              key={`${row.id}-${period}`}
                              period={period}
                              periods={periods}
                              people={row.calendarPeople}
                              positionRange={{
                                startBiWeek: row.positionStartBiWeek,
                                lwp: row.positionLwp,
                              }}
                            />
                          ))}
                        </TableRow>

                        {expanded ? (
                          <>
                            {related.positionRevisions.length > 0 ? (
                              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                                <TableCell
                                  colSpan={metadataColSpan + periods.length}
                                  sx={{
                                    ...cellSx,
                                    bgcolor: 'rgba(236,239,241,0.95)',
                                    py: 0.75,
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    letterSpacing: 0.3,
                                    textTransform: 'uppercase',
                                    color: 'text.secondary',
                                  }}
                                >
                                  Position revisions
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {related.positionRevisions.map((item) => (
                              <RelatedExpandRow
                                key={`${row.id}-position-${item.id}`}
                                rowId={row.id}
                                item={item}
                                periods={periods}
                                metadataColSpan={metadataColSpan}
                                canReview={canReview}
                                onView={() => openRelatedItem(item)}
                                onApprove={() => handleApproveRelated(item)}
                                onReject={() => setRejectTarget(item)}
                                sectionBg="rgba(245,245,245,0.9)"
                              />
                            ))}
                            {related.relatedPafs.length > 0 ? (
                              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                                <TableCell
                                  colSpan={metadataColSpan + periods.length}
                                  sx={{
                                    ...cellSx,
                                    bgcolor: 'rgba(236,239,241,0.95)',
                                    py: 0.75,
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    letterSpacing: 0.3,
                                    textTransform: 'uppercase',
                                    color: 'text.secondary',
                                  }}
                                >
                                  Related PAFs
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {related.relatedPafs.map((item) => (
                              <RelatedExpandRow
                                key={`${row.id}-paf-${item.id}`}
                                rowId={row.id}
                                item={item}
                                periods={periods}
                                metadataColSpan={metadataColSpan}
                                canReview={canReview}
                                onView={() => openRelatedItem(item)}
                                onApprove={() => handleApproveRelated(item)}
                                onReject={() => setRejectTarget(item)}
                                sectionBg="rgba(245,245,245,0.9)"
                              />
                            ))}
                          </>
                        ) : null}
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
