import { useState } from "react"
import {
  Calendar,
  Flag,
  Link2,
  MessageSquare,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface PlannerKanbanBoardProps {
  tasks: PlannerTask[]
  isLoading: boolean
  onSelectTask: (task: PlannerTask) => void
  onEditTask: (task: PlannerTask) => void
  onDeleteTask: (task: PlannerTask) => void
  onCreateInColumn: (status: PlannerTaskStatus) => void
  onMoveTask: (taskId: string, newStatus: PlannerTaskStatus, newPosition: number) => void
}

const AVATAR_TONES = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-600 text-white",
  "bg-slate-700 text-white",
]

export function PlannerKanbanBoard({
  tasks,
  isLoading,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onCreateInColumn,
  onMoveTask,
}: PlannerKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<PlannerTaskStatus | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANNER_STATUSES.map((status) => (
          <div key={status} className="space-y-3">
            <Skeleton className="h-8 w-36 rounded-full" />
            <div className="space-y-2.5">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const tasksByStatus: Record<PlannerTaskStatus, PlannerTask[]> = {
    "Not Started": [],
    Pending: [],
    "Under Review": [],
    Completed: [],
  }

  for (const task of tasks) {
    tasksByStatus[task.status].push(task)
  }

  const handleDragStart = (e: React.DragEvent, task: PlannerTask) => {
    setDraggedTaskId(task.id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  const handleDragOverColumn = (e: React.DragEvent, status: PlannerTaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOverStatus !== status) {
      setDragOverStatus(status)
    }
  }

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: PlannerTaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId
    setDraggedTaskId(null)
    setDragOverStatus(null)
    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const targetColumnTasks = tasksByStatus[targetStatus]
    const nextPosition = targetColumnTasks.length
    if (task.status === targetStatus) return

    onMoveTask(taskId, targetStatus, nextPosition)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {PLANNER_STATUSES.map((status) => {
        const meta = STATUS_META[status]
        const StatusIcon = meta.icon
        const columnTasks = tasksByStatus[status]
        const isDropTarget = dragOverStatus === status

        return (
          <section
            key={status}
            aria-label={`Kolom ${meta.label}`}
            onDragOver={(e) => handleDragOverColumn(e, status)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setDragOverStatus((prev) => (prev === status ? null : prev))
              }
            }}
            onDrop={(e) => handleDropOnColumn(e, status)}
            className={cn(
              "rounded-2xl border p-2.5 transition-colors duration-150 min-h-[220px] flex flex-col",
              isDropTarget
                ? "border-primary bg-primary/[0.04] border-dashed"
                : "border-border/70 bg-muted/35"
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  meta.pillClass
                )}
              >
                <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{meta.label}</span>
                <span className="ml-0.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 leading-none">
                  {columnTasks.length}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Opsi kolom ${meta.label}`}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onCreateInColumn(status)}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah tugas di sini</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Cards Stack */}
            <div className="space-y-2.5 flex-1">
              {columnTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    Belum ada tugas di tahap ini.
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const priorityMeta = PRIORITY_META[task.priority]
                  const overdue = isTaskOverdue(task.due_date, task.status)
                  const isDragging = draggedTaskId === task.id
                  const assignees = task.assignees || []

                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectTask(task)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onSelectTask(task)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Buka detail tugas ${task.task_code}: ${task.title}`}
                      className={cn(
                        "group rounded-xl border border-border bg-card p-3.5 space-y-2.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        isDragging
                          ? "opacity-60 shadow-lg ring-2 ring-primary/30 rotate-[1deg]"
                          : "hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      {/* Top row: Code + Priority + Action menu */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-muted-foreground">
                            <Link2 className="h-3 w-3 shrink-0" />
                            <span>{task.task_code}</span>
                          </span>

                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                              priorityMeta.badgeClass
                            )}
                          >
                            <Flag className="h-2.5 w-2.5 shrink-0" />
                            <span>{priorityMeta.label}</span>
                          </span>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={`Aksi tugas ${task.task_code}`}
                                  className="text-muted-foreground hover:text-foreground"
                                />
                              }
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>{task.task_code}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onSelectTask(task)}>
                                <Eye className="h-3.5 w-3.5" />
                                <span>Lihat Detail</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <Edit2 className="h-3.5 w-3.5" />
                                <span>Edit Tugas</span>
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                  <span>Pindah Status</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {PLANNER_STATUSES.filter((s) => s !== task.status).map(
                                    (targetStatus) => (
                                      <DropdownMenuItem
                                        key={targetStatus}
                                        onClick={() =>
                                          onMoveTask(
                                            task.id,
                                            targetStatus,
                                            tasksByStatus[targetStatus].length
                                          )
                                        }
                                      >
                                        <span>{STATUS_META[targetStatus].label}</span>
                                      </DropdownMenuItem>
                                    )
                                  )}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDeleteTask(task)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Hapus Tugas</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Title & Subtitle/Channel */}
                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-[13px] font-bold text-foreground leading-snug line-clamp-2">
                          {task.title}
                        </h3>
                        {(task.subtitle || task.channel) && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[task.subtitle, task.channel].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>

                      {/* Due Date Badge */}
                      {task.due_date && (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium",
                            overdue
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-border bg-muted/40 text-muted-foreground"
                          )}
                        >
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            Tenggat:{" "}
                            <strong className="font-semibold text-foreground">
                              {formatDateID(task.due_date)}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Footer: Assignees + Comments + Created Date */}
                      <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2">
                        <div className="flex items-center -space-x-1.5 min-w-0">
                          {assignees.length > 0 ? (
                            <>
                              {assignees.slice(0, 3).map((assignee, idx) => (
                                <span
                                  key={assignee.profile_id}
                                  title={assignee.profile?.full_name || "Anggota"}
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold",
                                    AVATAR_TONES[idx % AVATAR_TONES.length]
                                  )}
                                >
                                  {getInitials(assignee.profile?.full_name)}
                                </span>
                              ))}
                              {assignees.length > 3 && (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                                  +{assignees.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Belum ditugaskan</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.comments_count ?? 0}</span>
                          </span>
                          <span className="text-[10px]">{formatDateID(task.created_at)}</span>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            {/* Quick Add Button per Column */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCreateInColumn(status)}
              className="mt-2.5 w-full h-9 justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/70 text-xs font-semibold text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Tugas</span>
            </Button>
          </section>
        )
      })}
    </div>
  )
}
