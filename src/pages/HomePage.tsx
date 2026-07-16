import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VerifiedIcon from '@mui/icons-material/Verified'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ScienceIcon from '@mui/icons-material/Science'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import GroupIcon from '@mui/icons-material/Group'
import { APP_SEED_VERSION_KEY } from '../data/seedVersion'
import { ensureLatestSeedData } from '../data/seedAppData'

export default function HomePage() {
  const handleLoadSampleData = () => {
    localStorage.removeItem(APP_SEED_VERSION_KEY)
    ensureLatestSeedData()
    window.location.reload()
  }

  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Jansen Workflows
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Submit position requests, PAF approvals, and view the staffing plan matrix.
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ScienceIcon />}
        onClick={handleLoadSampleData}
        sx={{ mb: 4 }}
      >
        Load Sample Data
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="primary">
                  Staffing Plan
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit position requests for manager approval. Approved positions can be used for
                PAF approvals.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/staffing-plan"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                New Position Request
              </Button>
              <Button component={RouterLink} to="/staffing-plan/manager" variant="outlined">
                Manager Review
              </Button>
              <Button component={RouterLink} to="/staffing-plan/matrix" variant="outlined">
                View Staffing Plan
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <VerifiedIcon color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="secondary">
                  PAF Approvals
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Request PAF approval for a candidate against an approved staffing plan position.
                Managers can approve or reject with comments.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/project-authorization"
                variant="contained"
                color="secondary"
                endIcon={<ArrowForwardIcon />}
              >
                New PAF Approval
              </Button>
              <Button
                component={RouterLink}
                to="/project-authorization/manager"
                variant="outlined"
                color="secondary"
              >
                Manager Review
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="primary">
                  Roles &amp; Users
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create roles and users, then assign people with left/right selectors.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/roles"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Manage Roles
              </Button>
              <Button
                component={RouterLink}
                to="/users"
                variant="outlined"
                startIcon={<GroupIcon />}
              >
                Manage Users
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AccountTreeIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="primary">
                  Workflows
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Design flowchart steps, decision branches, assigned roles, and item states.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/workflows"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Open Workflow Editor
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
