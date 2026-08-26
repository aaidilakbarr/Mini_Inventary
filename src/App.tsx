import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Dashboard } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { BorrowingPage } from '@/pages/Borrowing'
import { SubscriptionsPage } from '@/pages/Subscriptions'
import { RemindersPage } from '@/pages/Reminders'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BaseLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="borrowing" element={<BorrowingPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="audit-logs" element={<div className="p-8 text-xs font-mono text-muted-foreground">Audit logs accessible to Admin only.</div>} />
              <Route path="settings" element={<div className="p-8 text-xs font-mono text-muted-foreground">System settings configuration.</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
