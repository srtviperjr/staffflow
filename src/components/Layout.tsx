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
import TableChartIcon from '@mui/icons-material/TableChart'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import GroupIcon from '@mui/icons-material/Group'
import ActingAsUserSwitcher from './ActingAsUserSwitcher'
import NavMenuGroup, { navButtonSx, type NavMenuItem } from './NavMenuGroup'
import { useRequestForms } from '../context/RequestFormsContext'
import { useRoles } from '../context/RolesContext'
import {
  canReviewRequests,
  canSubmitRequests,
  canViewStaffingMatrix,
  isAdmin,
} from '../utils/permissions'

export default function Layout() {
  const location = useLocation()
  const path = location.pathname
  const { currentUserRoles } = useRoles()
  const { openRequestForm, activeForm } = useRequestForms()

  const admin = isAdmin(currentUserRoles)
  const canSubmit = canSubmitRequests(currentUserRoles)
  const canReview = canReviewRequests(currentUserRoles)
  const canViewMatrix = canViewStaffingMatrix(currentUserRoles)

  const isHome = path === '/'
  const isStaffManagement = path.startsWith('/staffing-plan') || activeForm?.kind === 'staffing-plan'
  const isPafManagement =
    path.startsWith('/project-authorization') || activeForm?.kind === 'project-authorization'
  const isApplicationAdmin =
    path.startsWith('/roles') || path.startsWith('/users') || path.startsWith('/workflows')
  const wideLayout =
    path.startsWith('/staffing-plan/matrix') ||
    path.startsWith('/project-authorization/register') ||
    path.startsWith('/workflows')

  const staffItems = [
    canSubmit
      ? {
          label: 'Position Request',
          onClick: () => openRequestForm('staffing-plan'),
          icon: <AssignmentIcon fontSize="small" />,
          active: activeForm?.kind === 'staffing-plan',
        }
      : null,
    canReview
      ? {
          label: 'Position Requests Review',
          to: '/staffing-plan/manager',
          icon: <ManageAccountsIcon fontSize="small" />,
          active: path === '/staffing-plan/manager',
        }
      : null,
    canViewMatrix
      ? {
          label: 'Staffing Plan',
          to: '/staffing-plan/matrix',
          icon: <TableChartIcon fontSize="small" />,
          active: path === '/staffing-plan/matrix',
        }
      : null,
  ].filter(Boolean) as NavMenuItem[]

  const pafItems = [
    canSubmit
      ? {
          label: 'PAF Request',
          onClick: () => openRequestForm('project-authorization'),
          icon: <VerifiedIcon fontSize="small" />,
          active: activeForm?.kind === 'project-authorization',
        }
      : null,
    canReview
      ? {
          label: 'PAF Requests Review',
          to: '/project-authorization/manager',
          icon: <ManageAccountsIcon fontSize="small" />,
          active: path === '/project-authorization/manager',
        }
      : null,
    canViewMatrix
      ? {
          label: 'PAF Register',
          to: '/project-authorization/register',
          icon: <TableChartIcon fontSize="small" />,
          active: path === '/project-authorization/register',
        }
      : null,
  ].filter(Boolean) as NavMenuItem[]

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #D35400 0%, #7A3400 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
            py: { xs: 1, md: 0.5 },
          }}
        >
          <HomeIcon sx={{ fontSize: 28 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', mr: 1 }}
          >
            Jansen Workflows
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              startIcon={<HomeIcon />}
              sx={navButtonSx(isHome)}
            >
              Home
            </Button>

            {staffItems.length > 0 ? (
              <NavMenuGroup
                label="Staff Management"
                icon={<AssignmentIcon fontSize="small" />}
                active={isStaffManagement}
                items={staffItems}
              />
            ) : null}

            {pafItems.length > 0 ? (
              <NavMenuGroup
                label="PAF Management"
                icon={<VerifiedIcon fontSize="small" />}
                active={isPafManagement}
                items={pafItems}
              />
            ) : null}

            {admin ? (
              <NavMenuGroup
                label="Application Admin"
                icon={<AdminPanelSettingsIcon fontSize="small" />}
                active={isApplicationAdmin}
                items={[
                  {
                    label: 'Roles',
                    to: '/roles',
                    icon: <AdminPanelSettingsIcon fontSize="small" />,
                    active: path.startsWith('/roles'),
                  },
                  {
                    label: 'Users',
                    to: '/users',
                    icon: <GroupIcon fontSize="small" />,
                    active: path.startsWith('/users'),
                  },
                  {
                    label: 'Workflows',
                    to: '/workflows',
                    icon: <AccountTreeIcon fontSize="small" />,
                    active: path.startsWith('/workflows'),
                  },
                ]}
              />
            ) : null}
          </Box>

          <ActingAsUserSwitcher />
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, md: 5 },
          background:
            'radial-gradient(circle at top right, rgba(211,84,0,0.07), transparent 40%), radial-gradient(circle at bottom left, rgba(122,52,0,0.06), transparent 40%)',
        }}
      >
        <Container maxWidth={wideLayout ? false : 'lg'}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
