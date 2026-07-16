import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useRoles } from '../context/RolesContext'
import { isAdmin } from '../utils/permissions'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, currentUserRoles } = useRoles()

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!isAdmin(currentUserRoles)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
