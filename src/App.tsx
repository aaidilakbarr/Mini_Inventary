import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Dashboard } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { BorrowingPage } from '@/pages/Borrowing'
import { SubscriptionsPage } from '@/pages/Subscriptions'
import { RemindersPage } from '@/pages/Reminders'
import { LoginPage } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ShieldCheck, Settings } from 'lucide-react'

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
                    <BaseLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="borrowing" element={<BorrowingPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                
                {/* Admin Only Protected Routes */}
                <Route 
                  path="audit-logs" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <div className="p-6 rounded-xl border border-border/80 bg-card space-y-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          <h2 className="text-base font-bold text-foreground">Log Audit Sistem</h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Menampilkan riwayat perubahan sistem, mutasi inventaris, dan persetujuan yang dicatat otomatis oleh trigger database.
                        </p>
                        <div className="p-4 rounded-lg bg-muted/40 font-mono text-xs text-muted-foreground border border-border/60">
                          [Aliran Log Audit Aktif - Akses Terbuka untuk Administrator]
                        </div>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <div className="p-6 rounded-xl border border-border/80 bg-card space-y-3">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-primary" />
                          <h2 className="text-base font-bold text-foreground">Pengaturan Sistem Administrasi</h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Kelola profil organisasi, integrasi webhook Supabase, delegasi peran, dan jadwal otomatisasi.
                        </p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
