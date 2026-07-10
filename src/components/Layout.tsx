import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import HomeIcon from '@mui/icons-material/Home'

function navButtonSx(active: boolean) {
  return {
    opacity: active ? 1 : 0.75,
    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  }
}

export default function Layout() {
  const location = useLocation()
  const path = location.pathname

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
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <AssignmentIcon sx={{ fontSize: 32 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Jansen StaffFlow
          </Typography>

          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            size="small"
            startIcon={<HomeIcon />}
            sx={navButtonSx(path === '/')}
          >
            Home
          </Button>
          <Button
            component={RouterLink}
            to="/staffing-plan"
            color="inherit"
            size="small"
            startIcon={<PersonAddIcon />}
            sx={navButtonSx(path === '/staffing-plan')}
          >
            New Request
          </Button>
          <Button
            component={RouterLink}
            to="/staffing-plan/manager"
            color="inherit"
            size="small"
            startIcon={<ManageAccountsIcon />}
            sx={navButtonSx(path === '/staffing-plan/manager')}
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
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
