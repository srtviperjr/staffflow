import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import type { AppUser } from '../types/roles'
import { useRoles } from '../context/RolesContext'

function userMetaLine(user: AppUser, roleLabels?: string): string {
  const parts: string[] = [user.company]
  if (user.project) parts.push(user.project)
  if (roleLabels) parts.push(roleLabels)
  return parts.join(' · ')
}

function menuMetaLine(user: AppUser): string {
  const parts: string[] = [user.company]
  if (user.project) parts.push(user.project)
  parts.push(user.title)
  return parts.join(' · ')
}

export default function ActingAsUserSwitcher() {
  const { users, currentUser, currentUserRoles, setCurrentUserId } = useRoles()

  const roleLabels =
    currentUserRoles.length > 0
      ? currentUserRoles.map((role) => role.name).join(', ')
      : 'No roles assigned'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        ml: { xs: 0, md: 'auto' },
        pl: { md: 1 },
        minWidth: { xs: '100%', sm: 300 },
        maxWidth: 420,
      }}
    >
      <PersonOutlinedIcon sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.9, flexShrink: 0 }} />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          opacity: 0.95,
        }}
      >
        Acting as
      </Typography>
      <FormControl
        size="small"
        fullWidth
        sx={{
          minWidth: 0,
          bgcolor: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.28)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.55)',
          },
          '& .MuiSelect-select': { color: 'white', py: 1 },
          '& .MuiSvgIcon-root': { color: 'white' },
        }}
      >
        <Select
          labelId="acting-as-user-label"
          aria-label="Acting as"
          value={currentUser?.id ?? ''}
          onChange={(event) => setCurrentUserId(event.target.value)}
          displayEmpty
          renderValue={() => (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {currentUser?.name ?? 'Select user'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.2 }} noWrap>
                {currentUser ? userMetaLine(currentUser, roleLabels) : roleLabels}
              </Typography>
            </Box>
          )}
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.name}
                  {user.project ? (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontWeight: 500, color: 'text.secondary' }}
                    >
                      {' '}
                      ({user.project})
                    </Typography>
                  ) : null}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {menuMetaLine(user)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}
