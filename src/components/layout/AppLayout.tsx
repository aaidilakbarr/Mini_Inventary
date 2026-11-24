import { useAuth } from "@/hooks/useAuth"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { UserLayout } from "@/components/layout/UserLayout"
import { Loader2 } from "lucide-react"

export function AppLayout() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Memuat ruang kerja...</p>
      </div>
    )
  }

  return isAdmin ? <BaseLayout /> : <UserLayout />
}
