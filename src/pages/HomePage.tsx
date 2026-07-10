import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function HomePage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Jansen StaffFlow
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Submit staffing plan position requests and project authorization requests for manager review.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Staffing Plan
            </Typography>
            <Typography color="text.secondary">
              Submit position requests for manager approval. Approved positions can be used for
              project authorization.
            </Typography>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" component={RouterLink} to="/staffing-plan">
              New Position Request
            </Button>
            <Button variant="outlined" component={RouterLink} to="/staffing-plan/manager">
              Manager Review
            </Button>
          </CardActions>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Authorization
            </Typography>
            <Typography color="text.secondary">
              Request authorization for a candidate against an approved staffing plan position.
              Managers can approve or reject with comments.
            </Typography>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" component={RouterLink} to="/project-authorization">
              New Authorization Request
            </Button>
            <Button variant="outlined" component={RouterLink} to="/project-authorization/manager">
              Manager Review
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Box>
  )
}
