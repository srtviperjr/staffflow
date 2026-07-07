import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import { OnboardingProvider } from './context/OnboardingContext'
import { LabourChangeProvider } from './context/LabourChangeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import OnboardingRequestFormPage from './pages/onboarding/OnboardingRequestFormPage'
import OnboardingManagerPage from './pages/onboarding/OnboardingManagerPage'
import LabourChangeFormPage from './pages/labour/LabourChangeFormPage'
import LabourChangeManagerPage from './pages/labour/LabourChangeManagerPage'
import StaffingPlanPage from './pages/StaffingPlanPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OnboardingProvider>
        <LabourChangeProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="onboarding" element={<OnboardingRequestFormPage />} />
                <Route path="onboarding/manager" element={<OnboardingManagerPage />} />
                <Route path="labour-change" element={<LabourChangeFormPage />} />
                <Route path="labour-change/manager" element={<LabourChangeManagerPage />} />
                <Route path="staffing-plan" element={<StaffingPlanPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LabourChangeProvider>
      </OnboardingProvider>
    </ThemeProvider>
  )
}

export default App
