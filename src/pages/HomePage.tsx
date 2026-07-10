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

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Jansen StaffFlow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit position requests, PAF approvals, and view the staffing plan matrix.
      </Typography>

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
      </Grid>
    </Box>
  )
}
