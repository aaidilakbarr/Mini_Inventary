import { Link } from "react-router-dom"
import { CalendarClock, Bell, CreditCard, Package, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateID } from "@/lib/formatters"
import type { AgendaItem } from "@/lib/api/dashboard"

interface UpcomingAgendaCardProps {
  agenda: AgendaItem[]
}

export function UpcomingAgendaCard({ agenda }: UpcomingAgendaCardProps) {
  const getSourceIcon = (type: AgendaItem["type"]) => {
    switch (type) {
      case "borrowing":
        return <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      case "subscription":
        return <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      case "reminder":
      default:
        return <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
    }
  }

  const getUrgencyBadge = (item: AgendaItem) => {
    if (item.isOverdue) {
      return (
        <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 rounded-full shrink-0">
          Terlambat
        </Badge>
      )
    }
    if (item.priority === "Tinggi") {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 text-[9px] font-semibold px-1.5 py-0 rounded-full shrink-0">
          Urgensi Tinggi
        </Badge>
      )
    }
    if (item.priority === "Sedang") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 text-[9px] font-semibold px-1.5 py-0 rounded-full shrink-0">
          Mendekat
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0 rounded-full shrink-0 text-muted-foreground">
        Terjadwal
      </Badge>
    )
  }

  return (
    <Card className="h-full border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card rounded-2xl shadow-xs flex flex-col justify-between">
      <div>
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Agenda & Pengingat
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Jadwal jatuh tempo & komitmen terdekat
              </CardDescription>
            </div>

            <Link to="/reminders">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs text-primary hover:bg-primary/5 gap-1 font-semibold cursor-pointer"
              >
                <span>Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-0">
          {agenda.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Tidak ada agenda atau jadwal yang mendekati jatuh tempo.
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-border/50">
              {agenda.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="pt-2 first:pt-0 flex items-start justify-between gap-2 group block hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      {getSourceIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                        Jatuh tempo: <span className="text-foreground font-medium">{formatDateID(item.dueDate)}</span>
                      </p>
                    </div>
                  </div>

                  {getUrgencyBadge(item)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 sm:p-5 pt-0">
        <Link to="/reminders" className="block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-primary hover:bg-primary/5 gap-1 font-semibold justify-center cursor-pointer"
          >
            <span>Buka Kalender Pengingat</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
