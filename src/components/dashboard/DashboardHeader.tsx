import { ShieldCheck, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  userName?: string
  isAdmin?: boolean
}

export function DashboardHeader({ userName, isAdmin = false }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Dashboard
          </h1>
          {isAdmin ? (
            <Badge 
              variant="outline" 
              className="h-6 px-2 text-[11px] font-semibold text-primary border-primary/30 bg-primary/5 rounded-full inline-flex items-center gap-1 shrink-0"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Mode</span>
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="h-6 px-2 text-[11px] font-semibold text-muted-foreground border-border bg-muted/30 rounded-full inline-flex items-center gap-1 shrink-0"
            >
              <UserCheck className="h-3 w-3" />
              <span>Staff Mode</span>
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Pantau inventaris, peminjaman, langganan, dan agenda operasional.
          {userName && <span className="font-medium text-foreground"> Selamat datang kembali, {userName}.</span>}
        </p>
      </div>
    </div>
  )
}
