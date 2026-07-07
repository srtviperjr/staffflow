import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'

export default function Layout() {
  const location = useLocation()

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #00838f 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <AssignmentIndIcon sx={{ fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Employee Onboarding Portal
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            startIcon={<AssignmentIndIcon />}
            sx={{
              opacity: location.pathname === '/' ? 1 : 0.75,
              bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}
          >
            New Request
          </Button>
          <Button
            component={RouterLink}
            to="/manager"
            color="inherit"
            startIcon={<ManageAccountsIcon />}
            sx={{
              opacity: location.pathname === '/manager' ? 1 : 0.75,
              bgcolor:
                location.pathname === '/manager' ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}
          >
            Manager Review
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, md: 5 },
          background:
            'radial-gradient(circle at top right, rgba(21,101,192,0.06), transparent 40%), radial-gradient(circle at bottom left, rgba(0,131,143,0.06), transparent 40%)',
        }}
      >
        <Container maxWidth="md">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
