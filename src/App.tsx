import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import { OnboardingProvider } from './context/OnboardingContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import OnboardingRequestFormPage from './pages/onboarding/OnboardingRequestFormPage'
import OnboardingManagerPage from './pages/onboarding/OnboardingManagerPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OnboardingProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="onboarding" element={<OnboardingRequestFormPage />} />
              <Route path="onboarding/manager" element={<OnboardingManagerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OnboardingProvider>
    </ThemeProvider>
  )
}

export default App
