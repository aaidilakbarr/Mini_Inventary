import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { BorrowingPage } from '@/pages/Borrowing'
import { SubscriptionsPage } from '@/pages/Subscriptions'
import { RemindersPage } from '@/pages/Reminders'
import { LoginPage } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuditLogsPage } from '@/pages/AuditLogs'
import { SettingsPage } from '@/pages/Settings'
import { ProfilePage } from '@/pages/Profile'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Index Route redirects based on user role */}
                <Route index element={<RoleBasedRedirect />} />

                {/* Common Pages (Accessible by Admin, Staff, and User) */}
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="borrowing" element={<BorrowingPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Admin Only Protected Routes */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="reminders" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <RemindersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="audit-logs" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLogsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
