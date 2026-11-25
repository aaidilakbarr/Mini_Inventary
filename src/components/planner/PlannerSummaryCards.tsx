import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { PlannerSummaryStats } from "@/types/database"

export type SummaryQuickFilter = "all" | "in_progress" | "urgent" | "completed"

interface PlannerSummaryCardsProps {
  summary: PlannerSummaryStats
  isLoading: boolean
  activeQuickFilter: SummaryQuickFilter | null
  onSelectQuickFilter: (filter: SummaryQuickFilter) => void
}

export function PlannerSummaryCards({
  summary,
  isLoading,
  activeQuickFilter,
  onSelectQuickFilter,
}: PlannerSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3.5 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards: Array<{
    key: SummaryQuickFilter
    label: string
    value: string
    subtext: string
    icon: typeof ListTodo
    iconWrap: string
  }> = [
    {
      key: "all",
      label: "Total Tugas",
      value: String(summary.totalTasks),
      subtext: `${summary.byStatus["Not Started"]} belum dimulai`,
      icon: ListTodo,
      iconWrap: "bg-slate-900 text-white",
    },
    {
      key: "in_progress",
      label: "Sedang Berjalan",
      value: String(summary.inProgressTasks),
      subtext: `${summary.byStatus.Pending} pending, ${summary.byStatus["Under Review"]} tinjauan`,
      icon: Clock,
      iconWrap: "bg-primary/10 text-primary",
    },
    {
      key: "urgent",
      label: "Prioritas Mendesak",
      value: String(summary.urgentTasks),
      subtext: summary.urgentTasks > 0 ? "Perlu ditangani segera" : "Tidak ada tugas mendesak",
      icon: AlertTriangle,
      iconWrap: "bg-rose-50 text-rose-600",
    },
    {
      key: "completed",
      label: "Target Selesai",
      value: `${summary.completionRate}%`,
      subtext: `${summary.completedTasks} dari ${summary.totalTasks} tugas selesai`,
      icon: CheckCircle2,
      iconWrap: "bg-emerald-50 text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon
        const isSelected = activeQuickFilter === card.key
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectQuickFilter(card.key)}
            className={cn(
              "group text-left rounded-xl border bg-card p-4 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isSelected
                ? "border-primary bg-primary/[0.03]"
                : "border-border hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  card.iconWrap
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Saring</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {card.value}
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{card.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {card.subtext}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
