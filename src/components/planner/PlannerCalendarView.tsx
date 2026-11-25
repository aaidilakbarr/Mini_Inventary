import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { STATUS_META } from "./plannerConfig"
import type { PlannerTask } from "@/types/database"

interface PlannerCalendarViewProps {
  tasks: PlannerTask[]
  isLoading: boolean
  onSelectTask: (task: PlannerTask) => void
  onCreateTaskOnDate: (dateStr: string) => void
}

const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function PlannerCalendarView({
  tasks,
  isLoading,
  onSelectTask,
  onCreateTaskOnDate,
}: PlannerCalendarViewProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const todayKey = toDateKey(new Date())

  const { calendarDays, tasksByDate, unscheduledTasks } = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Convert JS Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

    const days: Array<{ date: Date; key: string; inCurrentMonth: boolean }> = []
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(year, month, 1 - startOffset + i)
      days.push({
        date: cellDate,
        key: toDateKey(cellDate),
        inCurrentMonth: cellDate.getMonth() === month,
      })
    }

    const byDate: Record<string, PlannerTask[]> = {}
    const unscheduled: PlannerTask[] = []

    for (const task of tasks) {
      if (!task.due_date) {
        unscheduled.push(task)
        continue
      }
      const d = new Date(task.due_date)
      if (isNaN(d.getTime())) {
        unscheduled.push(task)
        continue
      }
      const key = toDateKey(d)
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(task)
    }

    return { calendarDays: days, tasksByDate: byDate, unscheduledTasks: unscheduled }
  }, [cursor, tasks])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(cursor)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card">
          <h2 className="text-sm font-bold text-foreground capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
              }}
              className="h-8 text-xs"
            >
              Hari Ini
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="px-2.5 py-2 text-[11px] font-semibold text-muted-foreground text-center border-r last:border-r-0 border-border"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((cell) => {
                const cellTasks = tasksByDate[cell.key] || []
                const isToday = cell.key === todayKey

                return (
                  <div
                    key={cell.key}
                    className={cn(
                      "min-h-[112px] p-2 border-r border-b last:border-r-0 border-border flex flex-col gap-1.5",
                      cell.inCurrentMonth ? "bg-card" : "bg-muted/25 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : cell.inCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {cell.date.getDate()}
                      </span>

                      <button
                        type="button"
                        onClick={() => onCreateTaskOnDate(cell.key)}
                        aria-label={`Tambah tugas pada ${cell.key}`}
                        className="h-6 w-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 flex-1">
                      {cellTasks.slice(0, 3).map((task) => {
                        const statusMeta = STATUS_META[task.status]
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onSelectTask(task)}
                            className={cn(
                              "w-full text-left rounded-md border px-1.5 py-1 text-[11px] font-medium truncate cursor-pointer transition-colors hover:opacity-90",
                              statusMeta.badgeClass
                            )}
                            title={`${task.task_code}: ${task.title}`}
                          >
                            <span className="font-mono text-[10px] mr-1">{task.task_code}</span>
                            <span>{task.title}</span>
                          </button>
                        )
                      })}
                      {cellTasks.length > 3 && (
                        <p className="text-[10px] font-semibold text-muted-foreground px-1">
                          +{cellTasks.length - 3} tugas lainnya
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground">
                Belum Memiliki Tenggat ({unscheduledTasks.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Klik tugas untuk menambahkan jadwal
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unscheduledTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 hover:bg-accent px-2.5 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-colors"
                >
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {task.task_code}
                  </span>
                  <span className="truncate max-w-[200px]">{task.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
