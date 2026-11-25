import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateID } from "@/lib/formatters"
import { STATUS_META } from "./plannerConfig"
import type { PlannerTask } from "@/types/database"

interface PlannerTimelineViewProps {
  tasks: PlannerTask[]
  isLoading: boolean
  onSelectTask: (task: PlannerTask) => void
  onCreateTask: () => void
}

const WINDOW_DAYS = 14

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / msPerDay)
}

export function PlannerTimelineView({
  tasks,
  isLoading,
  onSelectTask,
  onCreateTask,
}: PlannerTimelineViewProps) {
  const [windowStart, setWindowStart] = useState(() => addDays(startOfDay(new Date()), -3))

  const today = startOfDay(new Date())

  const days = Array.from({ length: WINDOW_DAYS }, (_, idx) => addDays(windowStart, idx))

  const windowEnd = days[days.length - 1]
  const todayOffset = diffDays(today, windowStart)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-2.5">
          <p className="text-sm font-bold text-foreground">Belum ada jadwal di Timeline</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Buat tugas planner dengan tanggal mulai dan tenggat untuk memantau lini masa pengerjaan.
          </p>
          <Button type="button" size="sm" onClick={onCreateTask} className="mt-1">
            Buat Tugas Pertama
          </Button>
        </CardContent>
      </Card>
    )
  }

  const rangeLabel = `${formatDateID(windowStart.toISOString())} - ${formatDateID(
    windowEnd.toISOString()
  )}`

  return (
    <Card className="overflow-hidden">
      {/* Timeline Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">{rangeLabel}</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setWindowStart((prev) => addDays(prev, -7))}
            aria-label="Geser 7 hari sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWindowStart(addDays(startOfDay(new Date()), -3))}
            className="h-8 text-xs"
          >
            Hari Ini
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setWindowStart((prev) => addDays(prev, 7))}
            aria-label="Geser 7 hari berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Timeline Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Days Header */}
          <div className="grid grid-cols-[240px_1fr] border-b border-border bg-muted/40">
            <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r border-border">
              Tugas
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${WINDOW_DAYS}, minmax(0, 1fr))` }}
            >
              {days.map((day, idx) => {
                const isToday = idx === todayOffset
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "py-2 text-center border-r last:border-r-0 border-border/70",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        isToday ? "text-primary" : "text-foreground"
                      )}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const statusMeta = STATUS_META[task.status]
              const rawStart = task.start_date
                ? startOfDay(new Date(task.start_date))
                : task.due_date
                ? startOfDay(new Date(task.due_date))
                : startOfDay(new Date(task.created_at))
              const rawEnd = task.due_date
                ? startOfDay(new Date(task.due_date))
                : rawStart

              const taskStart = rawStart <= rawEnd ? rawStart : rawEnd
              const taskEnd = rawEnd >= rawStart ? rawEnd : rawStart

              const startIdx = diffDays(taskStart, windowStart)
              const endIdx = diffDays(taskEnd, windowStart)
              const isVisible = endIdx >= 0 && startIdx < WINDOW_DAYS

              const clampedStart = Math.max(0, startIdx)
              const clampedEnd = Math.min(WINDOW_DAYS - 1, endIdx)
              const spanCols = Math.max(1, clampedEnd - clampedStart + 1)

              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[240px_1fr] items-center hover:bg-muted/20 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="px-4 py-3 text-left border-r border-border min-w-0 cursor-pointer focus-visible:outline-none focus-visible:bg-muted/40"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", statusMeta.dotClass)} />
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                        {task.task_code}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {task.title}
                    </p>
                  </button>

                  <div className="relative h-12 flex items-center">
                    {/* Background day grid */}
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{ gridTemplateColumns: `repeat(${WINDOW_DAYS}, minmax(0, 1fr))` }}
                    >
                      {days.map((d, idx) => (
                        <div
                          key={d.toISOString()}
                          className={cn(
                            "border-r last:border-r-0 border-border/50",
                            idx === todayOffset && "bg-primary/[0.06]"
                          )}
                        />
                      ))}
                    </div>

                    {/* Task duration bar */}
                    {isVisible ? (
                      <div
                        className="relative z-10 w-full grid px-1"
                        style={{ gridTemplateColumns: `repeat(${WINDOW_DAYS}, minmax(0, 1fr))` }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectTask(task)}
                          style={{
                            gridColumn: `${clampedStart + 1} / span ${spanCols}`,
                          }}
                          title={`${task.task_code}: ${task.title} (${statusMeta.label})`}
                          className={cn(
                            "h-7 rounded-md px-2 text-[11px] font-semibold text-white truncate text-left cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            statusMeta.barClass
                          )}
                        >
                          {task.title}
                        </button>
                      </div>
                    ) : (
                      <span className="relative z-10 px-3 text-[11px] text-muted-foreground">
                        Di luar rentang tanggal ini
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
