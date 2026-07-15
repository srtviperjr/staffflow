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
import GroupIcon from '@mui/icons-material/Group'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { useRoles } from '../../context/RolesContext'
import type { AppRole, CreateUserInput } from '../../types/roles'

function not(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => !b.includes(value))
}

function intersection(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => b.includes(value))
}

const emptyForm: CreateUserInput = {
  name: '',
  email: '',
  title: '',
}

function RoleTransferList({
  title,
  roles,
  checkedIds,
  onToggle,
}: {
  title: string
  roles: AppRole[]
  checkedIds: readonly string[]
  onToggle: (roleId: string) => void
}) {
  return (
    <Paper variant="outlined" sx={{ width: '100%', height: 320, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(211,84,0,0.06)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {roles.length} {roles.length === 1 ? 'role' : 'roles'}
        </Typography>
      </Box>
      <Divider />
      <List dense component="div" role="list" sx={{ height: 260, overflow: 'auto', p: 0 }}>
        {roles.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No roles in this list
            </Typography>
          </Box>
        ) : (
          roles.map((role) => {
            const labelId = `user-role-transfer-${role.id}-label`
            return (
              <ListItemButton key={role.id} role="listitem" onClick={() => onToggle(role.id)}>
                <ListItemIcon>
                  <Checkbox
                    checked={checkedIds.includes(role.id)}
                    tabIndex={-1}
                    disableRipple
                    slotProps={{ input: { 'aria-labelledby': labelId } }}
                  />
                </ListItemIcon>
                <ListItemText
                  id={labelId}
                  primary={role.name}
                  secondary={role.description || `${role.userIds.length} members`}
                />
              </ListItemButton>
            )
          })
        )}
      </List>
    </Paper>
  )
}

export default function UsersManagementPage() {
  const {
    users,
    roles,
    createUser,
    updateUser,
    deleteUser,
    setRolesForUser,
    getRolesForUser,
  } = useRoles()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [createForm, setCreateForm] = useState<CreateUserInput>(emptyForm)
  const [editForm, setEditForm] = useState<CreateUserInput>(emptyForm)
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([])
  const [checked, setChecked] = useState<readonly string[]>([])
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId])

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId],
  )

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(emptyForm)
      setAssignedRoleIds([])
      setChecked([])
      return
    }
    setEditForm({
      name: selectedUser.name,
      email: selectedUser.email,
      title: selectedUser.title,
    })
    setAssignedRoleIds(getRolesForUser(selectedUser.id).map((role) => role.id))
    setChecked([])
    setEditError('')
  }, [selectedUser, getRolesForUser])

  const availableRoles = useMemo(
    () => roles.filter((role) => !assignedRoleIds.includes(role.id)),
    [roles, assignedRoleIds],
  )

  const assignedRoles = useMemo(
    () => roles.filter((role) => assignedRoleIds.includes(role.id)),
    [roles, assignedRoleIds],
  )

  const leftChecked = intersection(
    checked,
    availableRoles.map((role) => role.id),
  )
  const rightChecked = intersection(checked, assignedRoleIds)

  const handleToggle = (roleId: string) => {
    setChecked((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    )
  }

  const moveCheckedRight = () => {
    setAssignedRoleIds((prev) => [...prev, ...leftChecked])
    setChecked(not(checked, leftChecked))
  }

  const moveAllRight = () => {
    setAssignedRoleIds((prev) => [...prev, ...availableRoles.map((role) => role.id)])
    setChecked([])
  }

  const moveCheckedLeft = () => {
    setAssignedRoleIds((prev) => not(prev, rightChecked))
    setChecked(not(checked, rightChecked))
  }

  const moveAllLeft = () => {
    setAssignedRoleIds([])
    setChecked([])
  }

  const validateUserForm = (form: CreateUserInput, excludeUserId?: string) => {
    if (!form.name.trim()) return 'Name is required'
    if (!form.email.trim()) return 'Email is required'
    if (!form.title.trim()) return 'Title is required'
    const emailTaken = users.some(
      (user) =>
        user.email.toLowerCase() === form.email.trim().toLowerCase() &&
        user.id !== excludeUserId,
    )
    if (emailTaken) return 'A user with this email already exists'
    return ''
  }

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault()
    const error = validateUserForm(createForm)
    if (error) {
      setCreateError(error)
      return
    }

    const created = createUser(createForm)
    setCreateForm(emptyForm)
    setCreateError('')
    setSelectedUserId(created.id)
    setSuccessMessage(`Created user "${created.name}".`)
    setShowSuccess(true)
  }

  const handleSaveUser = () => {
    if (!selectedUser) return
    const error = validateUserForm(editForm, selectedUser.id)
    if (error) {
      setEditError(error)
      return
    }

    updateUser(selectedUser.id, editForm)
    setRolesForUser(selectedUser.id, assignedRoleIds)
    setEditError('')
    setSuccessMessage(`Updated ${editForm.name.trim()} and role assignments.`)
    setShowSuccess(true)
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return
    const name = selectedUser.name
    const nextSelected =
      users.find((user) => user.id !== selectedUser.id)?.id ?? ''
    deleteUser(selectedUser.id)
    setSelectedUserId(nextSelected)
    setSuccessMessage(`Deleted user "${name}".`)
    setShowSuccess(true)
  }

  const savedRoleIds = selectedUser
    ? getRolesForUser(selectedUser.id).map((role) => role.id)
    : []
  const hasUnsavedRoleChanges =
    assignedRoleIds.length !== savedRoleIds.length ||
    assignedRoleIds.some((id) => !savedRoleIds.includes(id))
  const hasUnsavedProfileChanges = selectedUser
    ? editForm.name !== selectedUser.name ||
      editForm.email !== selectedUser.email ||
      editForm.title !== selectedUser.title
    : false
  const hasUnsavedChanges = hasUnsavedRoleChanges || hasUnsavedProfileChanges

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <GroupIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" color="primary">
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create users and manage which roles they are assigned
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                Create User
              </Typography>
              <Box component="form" onSubmit={handleCreateUser} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Full Name"
                    value={createForm.name}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                      setCreateError('')
                    }}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={createForm.email}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                      setCreateError('')
                    }}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Title"
                    value={createForm.title}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                      setCreateError('')
                    }}
                    required
                    fullWidth
                  />
                  {createError ? <Alert severity="error">{createError}</Alert> : null}
                  <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                    Create User
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Existing users
              </Typography>
              <Stack spacing={1}>
                {users.map((user) => {
                  const userRoles = getRolesForUser(user.id)
                  return (
                    <Box
                      key={user.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: user.id === selectedUserId ? 'primary.main' : 'divider',
                        bgcolor:
                          user.id === selectedUserId ? 'rgba(211,84,0,0.06)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {user.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {userRoles.length > 0
                          ? userRoles.map((role) => role.name).join(', ')
                          : 'No roles'}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                Manage User
              </Typography>

              {users.length === 0 ? (
                <Alert severity="info">Create a user to begin managing profiles and roles.</Alert>
              ) : (
                <>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="user-select-label">User to manage</InputLabel>
                    <Select
                      labelId="user-select-label"
                      label="User to manage"
                      value={selectedUserId}
                      onChange={(event) => setSelectedUserId(event.target.value)}
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedUser ? (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        Profile
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Full Name"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, email: event.target.value }))
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Title"
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                      </Grid>

                      {editError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {editError}
                        </Alert>
                      ) : null}

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Role assignments
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Move roles between <strong>Available</strong> and{' '}
                        <strong>Assigned to {selectedUser.name}</strong>, then save.
                      </Typography>

                      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <RoleTransferList
                            title="Available roles"
                            roles={availableRoles}
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
                              disabled={availableRoles.length === 0}
                              aria-label="assign all roles"
                            >
                              <KeyboardDoubleArrowRightIcon fontSize="small" />
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={moveCheckedRight}
                              disabled={leftChecked.length === 0}
                              aria-label="assign selected roles"
                            >
                              <ChevronRightIcon fontSize="small" />
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={moveCheckedLeft}
                              disabled={rightChecked.length === 0}
                              aria-label="remove selected roles"
                            >
                              <ChevronLeftIcon fontSize="small" />
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={moveAllLeft}
                              disabled={assignedRoleIds.length === 0}
                              aria-label="remove all roles"
                            >
                              <KeyboardDoubleArrowLeftIcon fontSize="small" />
                            </Button>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <RoleTransferList
                            title={`Assigned to ${selectedUser.name}`}
                            roles={assignedRoles}
                            checkedIds={checked}
                            onToggle={handleToggle}
                          />
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 1,
                          mt: 3,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlinedIcon />}
                          onClick={handleDeleteUser}
                        >
                          Delete User
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveUser}
                          disabled={!hasUnsavedChanges}
                        >
                          Save User &amp; Roles
                        </Button>
                      </Box>
                    </>
                  ) : null}
                </>
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
