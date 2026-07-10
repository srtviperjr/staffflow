import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Employee Onboarding Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit new hire onboarding requests or review submitted requests as a manager.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h5" color="primary">
              Employee Onboarding
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
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
    </Box>
  )
}
