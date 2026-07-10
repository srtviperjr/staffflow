import { Box, Typography } from '@mui/material'

export default function HomePage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Request Portal
      </Typography>
      <Typography variant="body1" color="text.secondary">
        No request workflows are currently configured.
      </Typography>
    </Box>
  )
}
