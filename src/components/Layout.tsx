import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}
          >
            Jansen StaffFlow
          </Typography>
          <Button color="inherit" component={RouterLink} to="/staffing-plan">
            Staffing Plan
          </Button>
          <Button color="inherit" component={RouterLink} to="/staffing-plan/manager">
            Staffing Review
          </Button>
          <Button color="inherit" component={RouterLink} to="/project-authorization">
            Project Authorization
          </Button>
          <Button color="inherit" component={RouterLink} to="/project-authorization/manager">
            Authorization Review
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
