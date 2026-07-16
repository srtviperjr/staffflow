import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import AddIcon from '@mui/icons-material/Add'
import { useRoles } from '../../context/RolesContext'
import type { AppUser } from '../../types/roles'
import { validateProjectDirectorRoleMembers } from '../../utils/projectDirector'

function not(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => !b.includes(value))
}

function intersection(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => b.includes(value))
}

function UserTransferList({
  title,
  users,
  checkedIds,
  onToggle,
}: {
  title: string
  users: AppUser[]
  checkedIds: readonly string[]
  onToggle: (userId: string) => void
}) {
  return (
    <Paper variant="outlined" sx={{ width: '100%', height: 360, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(211,84,0,0.06)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {users.length} {users.length === 1 ? 'person' : 'people'}
        </Typography>
      </Box>
      <Divider />
      <List dense component="div" role="list" sx={{ height: 300, overflow: 'auto', p: 0 }}>
        {users.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No users in this list
            </Typography>
          </Box>
        ) : (
          users.map((user) => {
            const labelId = `transfer-list-item-${user.id}-label`
            return (
              <ListItemButton key={user.id} role="listitem" onClick={() => onToggle(user.id)}>
                <ListItemIcon>
                  <Checkbox
                    checked={checkedIds.includes(user.id)}
                    tabIndex={-1}
                    disableRipple
                    slotProps={{ input: { 'aria-labelledby': labelId } }}
                  />
                </ListItemIcon>
                <ListItemText
                  id={labelId}
                  primary={user.name}
                  secondary={`${user.company}${user.project ? ` · ${user.project}` : ''} · ${user.title}`}
                />
              </ListItemButton>
            )
          })
        )}
      </List>
    </Paper>
  )
}

export default function RolesManagementPage() {
  const { users, roles, createRole, assignUsersToRole } = useRoles()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [assignError, setAssignError] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [checked, setChecked] = useState<readonly string[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [createError, setCreateError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId],
  )

  useEffect(() => {
    if (selectedRole) {
      setAssignedIds([...selectedRole.userIds])
      setChecked([])
    }
  }, [selectedRole])

  const availableUsers = useMemo(
    () => users.filter((user) => !assignedIds.includes(user.id)),
    [users, assignedIds],
  )

  const assignedUsers = useMemo(
    () => users.filter((user) => assignedIds.includes(user.id)),
    [users, assignedIds],
  )

  const leftChecked = intersection(checked, availableUsers.map((user) => user.id))
  const rightChecked = intersection(checked, assignedIds)

  const handleToggle = (userId: string) => {
    setChecked((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const moveCheckedRight = () => {
    setAssignedIds((prev) => [...prev, ...leftChecked])
    setChecked(not(checked, leftChecked))
  }

  const moveAllRight = () => {
    setAssignedIds((prev) => [...prev, ...availableUsers.map((user) => user.id)])
    setChecked([])
  }

  const moveCheckedLeft = () => {
    setAssignedIds((prev) => not(prev, rightChecked))
    setChecked(not(checked, rightChecked))
  }

  const moveAllLeft = () => {
    setAssignedIds([])
    setChecked([])
  }

  const handleSaveAssignments = () => {
    if (!selectedRoleId) return
    const error = validateProjectDirectorRoleMembers({
      roleId: selectedRoleId,
      userIds: assignedIds,
      users,
    })
    if (error) {
      setAssignError(error)
      return
    }
    setAssignError('')
    assignUsersToRole(selectedRoleId, assignedIds)
    setSuccessMessage(`Updated members for ${selectedRole?.name ?? 'role'}.`)
    setShowSuccess(true)
  }

  const handleCreateRole = (event: React.FormEvent) => {
    event.preventDefault()
    const name = newRoleName.trim()
    if (!name) {
      setCreateError('Role name is required')
      return
    }
    if (roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) {
      setCreateError('A role with this name already exists')
      return
    }

    const created = createRole({
      name,
      description: newRoleDescription,
    })
    setNewRoleName('')
    setNewRoleDescription('')
    setCreateError('')
    setSelectedRoleId(created.id)
    setSuccessMessage(`Created role "${created.name}".`)
    setShowSuccess(true)
  }

  const hasUnsavedChanges =
    selectedRole != null &&
    (assignedIds.length !== selectedRole.userIds.length ||
      assignedIds.some((id) => !selectedRole.userIds.includes(id)))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" color="primary">
            Roles &amp; Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create roles and assign the five test users with a left/right selector
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                Create Role
              </Typography>
              <Box component="form" onSubmit={handleCreateRole} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Role Name"
                    value={newRoleName}
                    onChange={(event) => {
                      setNewRoleName(event.target.value)
                      setCreateError('')
                    }}
                    error={Boolean(createError)}
                    helperText={createError || 'e.g. Approver, Coordinator'}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={newRoleDescription}
                    onChange={(event) => setNewRoleDescription(event.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                    Create Role
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Existing roles
              </Typography>
              <Stack spacing={1}>
                {roles.map((role) => (
                  <Box
                    key={role.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: role.id === selectedRoleId ? 'primary.main' : 'divider',
                      bgcolor: role.id === selectedRoleId ? 'rgba(211,84,0,0.06)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedRoleId(role.id)
                      setAssignError('')
                    }}
                  >
                    <Typography variant="subtitle2">{role.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.userIds.length} assigned
                      {role.description ? ` · ${role.description}` : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                Assign Users
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="role-select-label">Role to modify</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Role to modify"
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedRole ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Move people between <strong>Available</strong> and{' '}
                    <strong>{selectedRole.name}</strong> using the arrows, then save.
                  </Typography>

                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <UserTransferList
                        title="Available users"
                        users={availableUsers}
                        checkedIds={checked}
                        onToggle={handleToggle}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Stack spacing={1} sx={{ alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={moveAllRight}
                          disabled={availableUsers.length === 0}
                          aria-label="move all to role"
                        >
                          <KeyboardDoubleArrowRightIcon fontSize="small" />
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={moveCheckedRight}
                          disabled={leftChecked.length === 0}
                          aria-label="move selected to role"
                        >
                          <ChevronRightIcon fontSize="small" />
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={moveCheckedLeft}
                          disabled={rightChecked.length === 0}
                          aria-label="remove selected from role"
                        >
                          <ChevronLeftIcon fontSize="small" />
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={moveAllLeft}
                          disabled={assignedIds.length === 0}
                          aria-label="remove all from role"
                        >
                          <KeyboardDoubleArrowLeftIcon fontSize="small" />
                        </Button>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 5 }}>
                      <UserTransferList
                        title={`In ${selectedRole.name}`}
                        users={assignedUsers}
                        checkedIds={checked}
                        onToggle={handleToggle}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveAssignments}
                      disabled={!hasUnsavedChanges}
                    >
                      Save Assignments
                    </Button>
                  </Box>
                  {assignError ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {assignError}
                    </Alert>
                  ) : null}
                </>
              ) : (
                <Alert severity="info">Create a role to start assigning users.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
