import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import Layout from './components/Layout'
import { OnboardingProvider } from './context/OnboardingContext'
import { LabourChangeProvider } from './context/LabourChangeContext'
import { StaffingPlanProvider } from './context/StaffingPlanContext'
import { ProjectAuthorizationProvider } from './context/ProjectAuthorizationContext'
import HomePage from './pages/HomePage'
import OnboardingRequestFormPage from './pages/onboarding/OnboardingRequestFormPage'
import OnboardingManagerPage from './pages/onboarding/OnboardingManagerPage'
import LabourChangeFormPage from './pages/labour/LabourChangeFormPage'
import LabourChangeManagerPage from './pages/labour/LabourChangeManagerPage'
import StaffingPlanFormPage from './pages/staffing/StaffingPlanFormPage'
import StaffingPlanManagerPage from './pages/staffing/StaffingPlanManagerPage'
import StaffingPlanMatrixPage from './pages/staffing/StaffingPlanMatrixPage'
import ProjectAuthorizationFormPage from './pages/authorization/ProjectAuthorizationFormPage'
import ProjectAuthorizationManagerPage from './pages/authorization/ProjectAuthorizationManagerPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OnboardingProvider>
        <LabourChangeProvider>
          <StaffingPlanProvider>
            <ProjectAuthorizationProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="onboarding" element={<OnboardingRequestFormPage />} />
                    <Route path="onboarding/manager" element={<OnboardingManagerPage />} />
                    <Route path="labour-change" element={<LabourChangeFormPage />} />
                    <Route path="labour-change/manager" element={<LabourChangeManagerPage />} />
                    <Route path="staffing-plan" element={<StaffingPlanFormPage />} />
                    <Route path="staffing-plan/manager" element={<StaffingPlanManagerPage />} />
                    <Route path="staffing-plan/matrix" element={<StaffingPlanMatrixPage />} />
                    <Route path="project-authorization" element={<ProjectAuthorizationFormPage />} />
                    <Route
                      path="project-authorization/revise/:requestId"
                      element={<ProjectAuthorizationFormPage />}
                    />
                    <Route
                      path="project-authorization/manager"
                      element={<ProjectAuthorizationManagerPage />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ProjectAuthorizationProvider>
          </StaffingPlanProvider>
        </LabourChangeProvider>
      </OnboardingProvider>
    </ThemeProvider>
  )
}

export default App
