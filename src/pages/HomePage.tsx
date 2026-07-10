import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        StaffFlow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit staffing plan position requests or review submitted requests as a manager.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h5" color="primary">
              Staffing Plan Position Requests
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Capture position details including phase, functional group, DSG, area, discipline,
            position, roster, and schedule dates for manager approval.
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
    </Box>
  )
}
