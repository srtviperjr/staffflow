import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProjectAuthorizationProvider } from './context/ProjectAuthorizationContext'
import { StaffingPlanProvider } from './context/StaffingPlanContext'
import { HomePage } from './pages/HomePage'
import ProjectAuthorizationFormPage from './pages/authorization/ProjectAuthorizationFormPage'
import ProjectAuthorizationManagerPage from './pages/authorization/ProjectAuthorizationManagerPage'
import StaffingPlanFormPage from './pages/staffing/StaffingPlanFormPage'
import StaffingPlanManagerPage from './pages/staffing/StaffingPlanManagerPage'

function App() {
  return (
    <BrowserRouter>
      <StaffingPlanProvider>
        <ProjectAuthorizationProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="staffing-plan" element={<StaffingPlanFormPage />} />
              <Route path="staffing-plan/manager" element={<StaffingPlanManagerPage />} />
              <Route path="project-authorization" element={<ProjectAuthorizationFormPage />} />
              <Route path="project-authorization/manager" element={<ProjectAuthorizationManagerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ProjectAuthorizationProvider>
      </StaffingPlanProvider>
    </BrowserRouter>
  )
}

export default App
