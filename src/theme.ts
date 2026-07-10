import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#DC7633',
      light: '#F7AE64',
      dark: '#AE6533',
    },
    secondary: {
      main: '#C66E33',
      light: '#EC924E',
      dark: '#955D33',
    },
    background: {
      default: '#faf6f3',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#c62828',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 22px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(220, 118, 51, 0.08)',
          border: '1px solid rgba(220, 118, 51, 0.1)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
})

export default theme
