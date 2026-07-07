import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Toolbar,
  Typography,
} from '@mui/material'
import TableChartIcon from '@mui/icons-material/TableChart'
import HomeIcon from '@mui/icons-material/Home'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DescriptionIcon from '@mui/icons-material/Description'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'

function navButtonSx(active: boolean) {
  return {
    opacity: active ? 1 : 0.75,
    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  }
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          opacity: 0.85,
          px: 0.5,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )
}

export default function Layout() {
  const location = useLocation()
  const path = location.pathname

  const isHome = path === '/'
  const isOnboarding = path.startsWith('/onboarding')
  const isLabour = path.startsWith('/labour-change')
  const isStaffingPlan = path.startsWith('/staffing-plan')

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
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mr: { xs: 0, md: 1 },
            }}
          >
            <HomeIcon sx={{ fontSize: 28 }} />
            Request Portal
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              flex: 1,
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              size="small"
              sx={navButtonSx(isHome)}
            >
              Home
            </Button>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: 'rgba(255,255,255,0.25)', display: { xs: 'none', sm: 'block' } }}
            />

            <NavGroup label="Onboarding">
              <Button
                component={RouterLink}
                to="/onboarding"
                color="inherit"
                size="small"
                startIcon={<PersonAddIcon />}
                sx={navButtonSx(isOnboarding && path === '/onboarding')}
              >
                New Request
              </Button>
              <Button
                component={RouterLink}
                to="/onboarding/manager"
                color="inherit"
                size="small"
                startIcon={<ManageAccountsIcon />}
                sx={navButtonSx(isOnboarding && path === '/onboarding/manager')}
              >
                Review
              </Button>
            </NavGroup>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: 'rgba(255,255,255,0.25)', display: { xs: 'none', sm: 'block' } }}
            />

            <NavGroup label="Labour Request">
              <Button
                component={RouterLink}
                to="/labour-change"
                color="inherit"
                size="small"
                startIcon={<DescriptionIcon />}
                sx={navButtonSx(isLabour && path === '/labour-change')}
              >
                New Request
              </Button>
              <Button
                component={RouterLink}
                to="/labour-change/manager"
                color="inherit"
                size="small"
                startIcon={<ManageAccountsIcon />}
                sx={navButtonSx(isLabour && path === '/labour-change/manager')}
              >
                Review
              </Button>
              <Button
                component={RouterLink}
                to="/staffing-plan"
                color="inherit"
                size="small"
                startIcon={<TableChartIcon />}
                sx={navButtonSx(isStaffingPlan)}
              >
                Staffing Plan
              </Button>
            </NavGroup>
          </Box>
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
        <Container maxWidth={isStaffingPlan ? 'xl' : 'md'}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
