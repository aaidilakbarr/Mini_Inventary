import { useMemo } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck2, Wrench } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAgendaUrgency } from "@/lib/agenda"
import { cn } from "@/lib/utils"
import type { ReminderItem } from "@/types/database"

interface UpcomingAgendaCardProps {
  reminders: ReminderItem[]
}

const SHORT_MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  inventory: "Perawatan Aset",
  Inventaris: "Inventaris",
  Peminjaman: "Peminjaman",
  Langganan: "Langganan",
  Perawatan: "Perawatan",
}

function parseShortDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: "--", month: "---" }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: SHORT_MONTHS[d.getMonth()],
  }
}

export function UpcomingAgendaCard({ reminders }: UpcomingAgendaCardProps) {
  const sortedAgendas = useMemo(() => {
    return reminders
      .filter((item) => item.status !== "Completed" && item.status !== "Dismissed")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  }, [reminders])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Agenda</CardTitle>
            {sortedAgendas.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {sortedAgendas.length}
              </Badge>
            )}
          </div>
          <Link to="/agenda" className="text-xs font-semibold text-primary hover:underline">
            Semua
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {sortedAgendas.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg space-y-1">
            <p className="font-semibold text-foreground">Tidak ada agenda aktif</p>
            <p className="text-[11px]">Jadwal dari halaman Agenda akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
            {sortedAgendas.map((item) => {
              const { day, month } = parseShortDate(item.due_date)
              const urgency = getAgendaUrgency(item)
              const isRepair = item.source_type === "inventory"
              const sourceLabel = SOURCE_LABELS[item.source_type || "manual"] || item.source_type || "Manual"

              return (
                <Link
                  key={item.id}
                  to="/agenda"
                  className={cn(
                    "p-2.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-2.5 group transition-all duration-150 hover:border-primary/40 hover:bg-accent/40 hover:translate-x-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    urgency.state === "overdue" && "border-destructive/30 bg-destructive/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg border flex flex-col items-center justify-center shrink-0 leading-none",
                        urgency.state === "overdue"
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : urgency.state === "today"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-muted/60 text-foreground border-border"
                      )}
                    >
                      <span className="text-xs font-extrabold tabular-nums">{day}</span>
                      <span className="text-[9px] font-bold tracking-wider opacity-85 mt-0.5">
                        {month}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        {isRepair ? (
                          <Wrench className="h-3 w-3 text-amber-600 shrink-0" />
                        ) : (
                          <CalendarCheck2 className="h-3 w-3 text-primary shrink-0" />
                        )}
                        <span className="truncate">{item.description?.trim() || sourceLabel}</span>
                      </p>
                    </div>
                  </div>

                  <Badge variant={urgency.badgeVariant} className="shrink-0">
                    {urgency.label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
