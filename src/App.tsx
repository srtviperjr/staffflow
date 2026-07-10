import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import { StaffingPlanProvider } from './context/StaffingPlanContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import StaffingPlanFormPage from './pages/staffing/StaffingPlanFormPage'
import StaffingPlanManagerPage from './pages/staffing/StaffingPlanManagerPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StaffingPlanProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="staffing-plan" element={<StaffingPlanFormPage />} />
              <Route path="staffing-plan/manager" element={<StaffingPlanManagerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StaffingPlanProvider>
    </ThemeProvider>
  )
}

export default App
