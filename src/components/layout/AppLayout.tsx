import { useAuth } from '@/hooks/useAuth'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { UserLayout } from '@/components/layout/UserLayout'

export function AppLayout() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-mono text-muted-foreground animate-pulse">
          Memuat tata letak antarmuka...
        </p>
      </div>
    )
  }

  // If user is admin, render the full admin layout with sidebar
  // Otherwise render the tailored user layout with top navigation
  return isAdmin ? <BaseLayout /> : <UserLayout />
}
