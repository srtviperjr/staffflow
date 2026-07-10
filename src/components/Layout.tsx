import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VerifiedIcon from '@mui/icons-material/Verified'

function navButtonSx(active: boolean) {
  return {
    opacity: active ? 1 : 0.75,
    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  }
}

export default function Layout() {
  const location = useLocation()
  const path = location.pathname

  const isHome = path === '/'
  const isStaffing = path.startsWith('/staffing-plan')
  const isAuthorization = path.startsWith('/project-authorization')

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
          <HomeIcon sx={{ fontSize: 28 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
          >
            Jansen StaffFlow
          </Typography>

          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            startIcon={<HomeIcon />}
            sx={navButtonSx(isHome)}
          >
            Home
          </Button>

          <Button
            component={RouterLink}
            to="/staffing-plan"
            color="inherit"
            startIcon={<AssignmentIcon />}
            sx={navButtonSx(isStaffing && path === '/staffing-plan')}
          >
            Position Request
          </Button>
          <Button
            component={RouterLink}
            to="/staffing-plan/manager"
            color="inherit"
            startIcon={<ManageAccountsIcon />}
            sx={navButtonSx(isStaffing && path === '/staffing-plan/manager')}
          >
            Position Requests Review
          </Button>

          <Button
            component={RouterLink}
            to="/project-authorization"
            color="inherit"
            startIcon={<VerifiedIcon />}
            sx={navButtonSx(isAuthorization && path === '/project-authorization')}
          >
            Authorization
          </Button>
          <Button
            component={RouterLink}
            to="/project-authorization/manager"
            color="inherit"
            startIcon={<ManageAccountsIcon />}
            sx={navButtonSx(isAuthorization && path === '/project-authorization/manager')}
          >
            Authorization Review
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
