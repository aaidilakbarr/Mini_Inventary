interface DashboardHeaderProps {
  userName?: string
  isAdmin?: boolean
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
      <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground">
        Dashboard
      </h1>
      {userName && (
        <span className="text-xs text-muted-foreground">
          {userName}
        </span>
      )}
    </div>
  )
}
