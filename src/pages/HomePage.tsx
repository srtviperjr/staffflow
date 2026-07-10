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
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VerifiedIcon from '@mui/icons-material/Verified'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Jansen StaffFlow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose a workflow to submit a new request or review submitted requests.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="primary">
                  Employee Onboarding
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit new hire onboarding requests and complete approval details including buddy
                assignment, machine setup, and department-specific tools.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/onboarding"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                New Request
              </Button>
              <Button component={RouterLink} to="/onboarding/manager" variant="outlined">
                Manager Review
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <DescriptionIcon color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="secondary">
                  Labour Change Request
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit labour change requests for projects JS1 and JS2, including urgency, project
                details, and reason for change.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/labour-change"
                variant="contained"
                color="secondary"
                endIcon={<ArrowForwardIcon />}
              >
                New Request
              </Button>
              <Button
                component={RouterLink}
                to="/labour-change/manager"
                variant="outlined"
                color="secondary"
              >
                Review Requests
              </Button>
            </CardActions>
          </Card>
        </Grid>

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
                project authorization.
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
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <VerifiedIcon color="secondary" sx={{ fontSize: 40 }} />
                <Typography variant="h5" color="secondary">
                  Project Authorization
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Request authorization for a candidate against an approved staffing plan position.
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
                New Authorization Request
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
      </Grid>
    </Box>
  )
}
