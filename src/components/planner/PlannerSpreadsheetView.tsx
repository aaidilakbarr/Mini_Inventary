import {
  Flag,
  MessageSquare,
  Edit2,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateID } from "@/lib/formatters"
import {
  PLANNER_STATUSES,
  PRIORITY_META,
  STATUS_META,
  getInitials,
  isTaskOverdue,
} from "./plannerConfig"
import type { PlannerTask, PlannerTaskStatus } from "@/types/database"

interface PlannerSpreadsheetViewProps {
  tasks: PlannerTask[]
  isLoading: boolean
  onSelectTask: (task: PlannerTask) => void
  onEditTask: (task: PlannerTask) => void
  onDeleteTask: (task: PlannerTask) => void
  onQuickStatusChange: (task: PlannerTask, newStatus: PlannerTaskStatus) => void
  onCreateTask: () => void
}

export function PlannerSpreadsheetView({
  tasks,
  isLoading,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
  onCreateTask,
}: PlannerSpreadsheetViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-2.5">
          <p className="text-sm font-bold text-foreground">Tidak ada tugas yang cocok</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tambahkan tugas baru atau ubah filter pencarian untuk melihat daftar rencana konten.
          </p>
          <Button type="button" size="sm" onClick={onCreateTask} className="mt-1">
            Buat Tugas Pertama
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mobile Stacked Cards */}
      <div className="md:hidden space-y-2.5">
        {tasks.map((task) => {
          const priorityMeta = PRIORITY_META[task.priority]
          const overdue = isTaskOverdue(task.due_date, task.status)
          return (
            <Card key={task.id} className="overflow-hidden">
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {task.task_code}
                    </span>
                    <p className="text-sm font-bold text-foreground leading-snug mt-0.5">
                      {task.title}
                    </p>
                    {(task.subtitle || task.channel) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[task.subtitle, task.channel].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </button>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold shrink-0",
                      priorityMeta.badgeClass
                    )}
                  >
                    <Flag className="h-2.5 w-2.5" />
                    <span>{priorityMeta.label}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                  <div className="w-40">
                    <Select
                      value={task.status}
                      onValueChange={(val) => {
                        if (val && val !== task.status) {
                          onQuickStatusChange(task, val as PlannerTaskStatus)
                        }
                      }}
                    >
                      <SelectTrigger size="sm" aria-label={`Ubah status ${task.task_code}`}>
                        <SelectValue>{STATUS_META[task.status].label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PLANNER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSelectTask(task)}
                      aria-label={`Detail ${task.task_code}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEditTask(task)}
                      aria-label={`Edit ${task.task_code}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteTask(task)}
                      aria-label={`Hapus ${task.task_code}`}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {task.due_date && (
                  <p
                    className={cn(
                      "text-[11px] flex items-center gap-1",
                      overdue ? "text-rose-700 font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Tenggat: {formatDateID(task.due_date)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Spreadsheet Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-24">Kode</TableHead>
                <TableHead className="min-w-[240px]">Tugas & Kanal</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-28">Prioritas</TableHead>
                <TableHead className="w-36">PIC</TableHead>
                <TableHead className="w-32">Tenggat</TableHead>
                <TableHead className="w-20 text-center">Diskusi</TableHead>
                <TableHead className="w-28 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const priorityMeta = PRIORITY_META[task.priority]
                const overdue = isTaskOverdue(task.due_date, task.status)
                const assignees = task.assignees || []

                return (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {task.task_code}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="text-left group cursor-pointer focus-visible:outline-none focus-visible:underline"
                      >
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        {(task.subtitle || task.channel) && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {[task.subtitle, task.channel].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(val) => {
                          if (val && val !== task.status) {
                            onQuickStatusChange(task, val as PlannerTaskStatus)
                          }
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Ubah status ${task.task_code}`}
                          className="h-7 text-[11px]"
                        >
                          <SelectValue>{STATUS_META[task.status].label}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PLANNER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_META[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                          priorityMeta.badgeClass
                        )}
                      >
                        <Flag className="h-2.5 w-2.5" />
                        <span>{priorityMeta.label}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {assignees.length > 0 ? (
                        <div className="flex items-center -space-x-1.5">
                          {assignees.slice(0, 3).map((a) => (
                            <span
                              key={a.profile_id}
                              title={a.profile?.full_name || "Anggota"}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground text-[10px] font-bold"
                            >
                              {getInitials(a.profile?.full_name)}
                            </span>
                          ))}
                          {assignees.length > 3 && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                              +{assignees.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Belum ada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          overdue ? "text-rose-700 font-semibold" : "text-foreground"
                        )}
                      >
                        {task.due_date ? formatDateID(task.due_date) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{task.comments_count ?? 0}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onSelectTask(task)}
                          aria-label={`Detail ${task.task_code}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEditTask(task)}
                          aria-label={`Edit ${task.task_code}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteTask(task)}
                          aria-label={`Hapus ${task.task_code}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
