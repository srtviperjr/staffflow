import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import { useRoles } from '../context/RolesContext'

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
        minWidth: { xs: '100%', sm: 260 },
        maxWidth: 340,
      }}
    >
      <PersonOutlinedIcon sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.9 }} />
      <FormControl
        size="small"
        fullWidth
        sx={{
          bgcolor: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.28)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.55)',
          },
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.85)' },
          '& .MuiSelect-select': { color: 'white', py: 1 },
          '& .MuiSvgIcon-root': { color: 'white' },
        }}
      >
        <InputLabel id="acting-as-user-label">Acting as</InputLabel>
        <Select
          labelId="acting-as-user-label"
          label="Acting as"
          value={currentUser?.id ?? ''}
          onChange={(event) => setCurrentUserId(event.target.value)}
          renderValue={() => (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {currentUser?.name ?? 'Select user'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.2 }} noWrap>
                {roleLabels}
              </Typography>
            </Box>
          )}
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.title}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}
