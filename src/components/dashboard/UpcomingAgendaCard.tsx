import { Link } from "react-router-dom"
import { CalendarCheck2, CreditCard, Package } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AgendaItem } from "@/lib/api/dashboard"

interface UpcomingAgendaCardProps {
  agenda: AgendaItem[]
}

const SHORT_MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]

function parseShortDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: "--", month: "---" }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: SHORT_MONTHS[d.getMonth()],
  }
}

export function UpcomingAgendaCard({ agenda }: UpcomingAgendaCardProps) {
  const getSourceIcon = (type: AgendaItem["type"]) => {
    switch (type) {
      case "borrowing":
        return <Package className="h-3 w-3 text-primary" />
      case "subscription":
        return <CreditCard className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
      case "reminder":
      default:
        return <CalendarCheck2 className="h-3 w-3 text-amber-700 dark:text-amber-400" />
    }
  }

  const getUrgencyBadge = (item: AgendaItem) => {
    if (item.isOverdue) return <Badge variant="destructive">Terlambat</Badge>
    if (item.priority === "Tinggi") return <Badge variant="destructive">Tinggi</Badge>
    if (item.priority === "Sedang") return <Badge variant="warning">Mendekat</Badge>
    return <Badge variant="outline">Terjadwal</Badge>
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Agenda</CardTitle>
            {agenda.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {agenda.length}
              </Badge>
            )}
          </div>
          <Link to="/agenda" className="text-xs font-semibold text-primary hover:underline">
            Semua
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {agenda.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Tidak ada agenda mendatang.
          </div>
        ) : (
          <div className="space-y-2">
            {agenda.slice(0, 5).map((item) => {
              const { day, month } = parseShortDate(item.dueDate)
              return (
                <Link
                  key={item.id}
                  to={item.link}
                  className={cn(
                    "p-2.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-2.5 group transition-all duration-150 hover:border-primary/40 hover:bg-accent/40 hover:translate-x-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    item.isOverdue && "border-destructive/30 bg-destructive/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Calendar Date Pill */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg border flex flex-col items-center justify-center shrink-0 leading-none",
                        item.isOverdue
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "bg-muted/60 text-foreground border-border"
                      )}
                    >
                      <span className="text-xs font-extrabold tabular-nums">{day}</span>
                      <span className="text-[9px] font-bold tracking-wider opacity-80 mt-0.5">
                        {month}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        {getSourceIcon(item.type)}
                        <span className="truncate">{item.subtitle}</span>
                      </p>
                    </div>
                  </div>

                  {getUrgencyBadge(item)}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
