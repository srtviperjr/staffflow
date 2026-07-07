import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import { RequestProvider } from './context/RequestContext'
import Layout from './components/Layout'
import RequestFormPage from './pages/RequestFormPage'
import ManagerRequestsPage from './pages/ManagerRequestsPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RequestProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RequestFormPage />} />
              <Route path="manager" element={<ManagerRequestsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RequestProvider>
    </ThemeProvider>
  )
}

export default App
