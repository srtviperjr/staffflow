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
import VerifiedIcon from '@mui/icons-material/Verified'
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
import GanttBarCell from '../../components/GanttBarCell'
import PafDetailDialog from '../../components/PafDetailDialog'
import RejectDialog from '../../components/RejectDialog'
import { filterByCompanyVisibility } from '../../constants/companies'
import { useProjectAuthorizationRequests } from '../../context/ProjectAuthorizationContext'
import { useRoles } from '../../context/RolesContext'
import { canReviewRequests, canSubmitRequests } from '../../utils/permissions'
import {
  formatRelatedItemCaption,
  getRelatedItemsForPafRequest,
  type RelatedRegisterItem,
} from '../../utils/relatedRegisterItems'
import type { ProjectAuthorizationRequest } from '../../types/projectAuthorization'
import {
  DEFAULT_PAF_COLUMN_ORDER,
  PAF_REGISTER_COLUMN_DEFS,
  buildPafRegisterRows,
  filterPafRegisterRows,
  getOrderedVisiblePafColumns,
  getPafRegisterPeriods,
  getUniquePafColumnValues,
  type PafRegisterColumnId,
} from '../../utils/pafRegister'

const COLUMN_ORDER_KEY = 'paf-register-column-order'
const COLUMN_VISIBLE_KEY = 'paf-register-visible-columns'
const EXPAND_COL_WIDTH = 48
const ACTIONS_COL_WIDTH = 96

const cellSx = {
  border: '1px solid #bdbdbd',
  fontSize: '0.75rem',
  px: 1,
  py: 0.75,
  whiteSpace: 'nowrap' as const,
}

const periodHeaderSx = {
  ...cellSx,
  minWidth: 28,
  maxWidth: 28,
  textAlign: 'center' as const,
  verticalAlign: 'bottom' as const,
  height: 96,
  p: 0.25,
}

const rotatedLabelSx = {
  writingMode: 'vertical-rl' as const,
  transform: 'rotate(180deg)',
  fontSize: '0.65rem',
  fontWeight: 600,
  lineHeight: 1.1,
}

function statusChipColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function loadColumnOrder(): PafRegisterColumnId[] {
  try {
    const stored = localStorage.getItem(COLUMN_ORDER_KEY)
    if (!stored) return [...DEFAULT_PAF_COLUMN_ORDER]
    const parsed = JSON.parse(stored) as PafRegisterColumnId[]
    if (!Array.isArray(parsed)) return [...DEFAULT_PAF_COLUMN_ORDER]
    const known = new Set(DEFAULT_PAF_COLUMN_ORDER)
    const filtered = parsed.filter((id) => known.has(id))
    for (const id of DEFAULT_PAF_COLUMN_ORDER) {
      if (!filtered.includes(id)) filtered.push(id)
    }
    return filtered
  } catch {
    return [...DEFAULT_PAF_COLUMN_ORDER]
  }
}

function loadVisibleColumns(): PafRegisterColumnId[] {
  try {
    const stored = localStorage.getItem(COLUMN_VISIBLE_KEY)
    if (!stored) return [...DEFAULT_PAF_COLUMN_ORDER]
    const parsed = JSON.parse(stored) as PafRegisterColumnId[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_PAF_COLUMN_ORDER]
    const known = new Set(DEFAULT_PAF_COLUMN_ORDER)
    return parsed.filter((id) => known.has(id))
  } catch {
    return [...DEFAULT_PAF_COLUMN_ORDER]
  }
}

export default function PafRegisterPage() {
  const navigate = useNavigate()
  const { currentUser, currentUserRoles } = useRoles()
  const { requests, approveRequest, rejectRequest } = useProjectAuthorizationRequests()
  const canRevise = canSubmitRequests(currentUserRoles)
  const canReview = canReviewRequests(currentUserRoles)

  const [selectedPaf, setSelectedPaf] = useState<ProjectAuthorizationRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<RelatedRegisterItem | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [columnOrder, setColumnOrder] = useState<PafRegisterColumnId[]>(loadColumnOrder)
  const [visibleColumns, setVisibleColumns] = useState<PafRegisterColumnId[]>(loadVisibleColumns)
  const [filters, setFilters] = useState<Partial<Record<PafRegisterColumnId, string>>>({})
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder))
  }, [columnOrder])

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBLE_KEY, JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const visibleRequests = useMemo(
    () => filterByCompanyVisibility(requests, currentUser?.company),
    [requests, currentUser?.company],
  )

  const periods = useMemo(() => getPafRegisterPeriods(), [])
  const rows = useMemo(() => buildPafRegisterRows(visibleRequests), [visibleRequests])
  const filteredRows = useMemo(() => filterPafRegisterRows(rows, filters), [rows, filters])
  const visibleColumnDefs = useMemo(
    () => getOrderedVisiblePafColumns(columnOrder, visibleColumns),
    [columnOrder, visibleColumns],
  )

  const relatedByRowId = useMemo(() => {
    const map = new Map<string, RelatedRegisterItem[]>()
    for (const row of rows) {
      map.set(row.id, getRelatedItemsForPafRequest(row.request, visibleRequests))
    }
    return map
  }, [rows, visibleRequests])

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  )

  const setFilterValue = (columnId: PafRegisterColumnId, value: string) => {
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

  const toggleColumnVisible = (columnId: PafRegisterColumnId) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== columnId)
      }
      return [...prev, columnId]
    })
  }

  const moveColumn = (columnId: PafRegisterColumnId, direction: -1 | 1) => {
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
    setColumnOrder([...DEFAULT_PAF_COLUMN_ORDER])
    setVisibleColumns([...DEFAULT_PAF_COLUMN_ORDER])
  }

  const orderedColumnDefsForPanel = useMemo(
    () =>
      columnOrder
        .map((id) => PAF_REGISTER_COLUMN_DEFS.find((column) => column.id === id))
        .filter((column): column is (typeof PAF_REGISTER_COLUMN_DEFS)[number] => Boolean(column)),
    [columnOrder],
  )

  const metadataColSpan = visibleColumnDefs.length + 1 + (canRevise ? 1 : 0)

  const handleRejectConfirm = (comment: string) => {
    if (!rejectTarget) return
    rejectRequest(rejectTarget.id, comment)
    setRejectTarget(null)
    setSelectedPaf(null)
  }

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
          <VerifiedIcon color="secondary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" color="secondary">
              PAF Register
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PAF requests and revisions with a Gantt-style duration calendar on the right.
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
            color="secondary"
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
            Show/hide and reorder fields. The duration calendar stays fixed on the right.
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
                        disabled={index === 0}
                        onClick={() => moveColumn(column.id, -1)}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
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
                No PAF requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit PAF requests against approved staffing positions to populate the register.
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
                  <TableRow>
                    <TableCell
                      sx={{
                        ...cellSx,
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        zIndex: 6,
                        bgcolor: '#6a1b9a',
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
                          bgcolor: '#6a1b9a',
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
                          bgcolor: '#6a1b9a',
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
                        sx={{ ...periodHeaderSx, bgcolor: '#6a1b9a', color: 'white', zIndex: 4 }}
                      >
                        <Box sx={rotatedLabelSx}>{period}</Box>
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
                        bgcolor: '#f3e5f5',
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
                          bgcolor: '#f3e5f5',
                          minWidth: ACTIONS_COL_WIDTH,
                          width: ACTIONS_COL_WIDTH,
                        }}
                      />
                    ) : null}
                    {visibleColumnDefs.map((column) => {
                      const options = getUniquePafColumnValues(rows, column.id)
                      return (
                        <TableCell
                          key={`filter-${column.id}`}
                          sx={{
                            ...cellSx,
                            position: 'sticky',
                            top: 40,
                            zIndex: 5,
                            bgcolor: '#f3e5f5',
                            minWidth: column.minWidth ?? 110,
                            p: 0.5,
                          }}
                        >
                          <FormControl size="small" fullWidth>
                            <Select
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
                    <TableCell
                      colSpan={periods.length}
                      sx={{
                        ...cellSx,
                        position: 'sticky',
                        top: 40,
                        zIndex: 4,
                        bgcolor: '#f3e5f5',
                        fontSize: '0.7rem',
                        color: 'text.secondary',
                        textAlign: 'center',
                      }}
                    >
                      Duration calendar — each person has a unique highlight colour from start through
                      last working day
                    </TableCell>
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
                              zIndex: 2,
                              bgcolor: 'background.paper',
                              minWidth: EXPAND_COL_WIDTH,
                              width: EXPAND_COL_WIDTH,
                              p: 0.25,
                            }}
                          >
                            <IconButton
                              size="small"
                              aria-label={expanded ? 'Collapse revisions' : 'Expand revisions'}
                              onClick={() =>
                                setExpandedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                              }
                              disabled={related.length === 0}
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
                                color="secondary"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/project-authorization/revise/${row.id}`)}
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
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
                                sx={{ ...cellSx, minWidth: column.minWidth ?? 110 }}
                              >
                                {column.id === 'status' ? (
                                  <Chip size="small" label={value} color={statusChipColor(value)} />
                                ) : column.id === 'candidate' ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '2px',
                                        bgcolor: row.barColor,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Button
                                      variant="text"
                                      size="small"
                                      onClick={() => setSelectedPaf(row.request)}
                                      sx={{
                                        textTransform: 'none',
                                        p: 0,
                                        minWidth: 0,
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {value}
                                    </Button>
                                  </Box>
                                ) : (
                                  value
                                )}
                              </TableCell>
                            )
                          })}
                          {periods.map((period) => (
                            <GanttBarCell
                              key={`${row.id}-${period}`}
                              period={period}
                              periods={periods}
                              startBiWeek={row.startBiWeekRaw}
                              lwp={row.lwpRaw}
                              color={row.barColor}
                              title={`${row.candidate}: ${row.startBiWeek} → ${row.lwp}`}
                            />
                          ))}
                        </TableRow>

                        {expanded
                          ? related.map((item) => (
                              <TableRow
                                key={`${row.id}-rev-${item.id}`}
                                sx={{ bgcolor: 'rgba(106, 27, 154, 0.04)' }}
                              >
                                <TableCell
                                  colSpan={metadataColSpan}
                                  sx={{ ...cellSx, bgcolor: 'rgba(243,229,245,0.65)', py: 1 }}
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
                                        <Chip size="small" label={`Rev ${item.revision}`} variant="outlined" />
                                        <Chip
                                          size="small"
                                          label={item.status}
                                          color={statusChipColor(item.status)}
                                        />
                                      </Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatRelatedItemCaption(item)}
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => item.pafRequest && setSelectedPaf(item.pafRequest)}
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
                                            onClick={() => approveRequest(item.id)}
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
                                {periods.map((period) =>
                                  item.startBiWeekRaw && item.lwpRaw ? (
                                    <GanttBarCell
                                      key={`${row.id}-${item.id}-${period}`}
                                      period={period}
                                      periods={periods}
                                      startBiWeek={item.startBiWeekRaw}
                                      lwp={item.lwpRaw}
                                      color={item.barColor}
                                      title={`${item.title}: ${item.startBiWeek} → ${item.lwp}`}
                                      emptyBgcolor="rgba(243,229,245,0.65)"
                                    />
                                  ) : (
                                    <TableCell
                                      key={`${row.id}-${item.id}-${period}`}
                                      sx={{
                                        ...cellSx,
                                        bgcolor: 'rgba(243,229,245,0.65)',
                                        minWidth: 28,
                                      }}
                                    />
                                  ),
                                )}
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
              Showing {filteredRows.length} of {rows.length} PAF requests
              {activeFilterCount > 0
                ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`
                : ''}
              {' · '}
              Calendar bars use a per-person colour from start bi-week to last working day
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
          approveRequest(selectedPaf.id)
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
