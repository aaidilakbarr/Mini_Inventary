import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RoleBasedRedirect() {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-mono text-muted-foreground animate-pulse">
          Memuat hak akses...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={isAdmin ? "/dashboard" : "/inventory"} replace />
}
