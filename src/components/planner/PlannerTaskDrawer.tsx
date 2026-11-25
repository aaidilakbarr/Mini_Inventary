import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Calendar,
  Edit2,
  Flag,
  Loader2,
  MessageSquare,
  Send,
  Tag,
  Trash2,
  Users,
  Radio,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateID, formatDateTimeID } from "@/lib/formatters"
import {
  createPlannerComment,
  deletePlannerComment,
  fetchPlannerComments,
} from "@/lib/api/planner"
import {
  PLANNER_PRIORITIES,
  PLANNER_STATUSES,
  PRIORITY_META,
  STATUS_META,
  getInitials,
  isTaskOverdue,
} from "./plannerConfig"
import type {
  PlannerTask,
  PlannerTaskPriority,
  PlannerTaskStatus,
} from "@/types/database"

interface PlannerTaskDrawerProps {
  task: PlannerTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (task: PlannerTask) => void
  onDelete: (task: PlannerTask) => void
  onInlineUpdate: (
    taskId: string,
    patch: { status?: PlannerTaskStatus; priority?: PlannerTaskPriority }
  ) => void
}

export function PlannerTaskDrawer({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onInlineUpdate,
}: PlannerTaskDrawerProps) {
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState("")

  const {
    data: comments = [],
    isLoading: isLoadingComments,
    isError: isCommentsError,
  } = useQuery({
    queryKey: ["planner-comments", task?.id],
    queryFn: () => fetchPlannerComments(task!.id),
    enabled: Boolean(open && task?.id),
  })

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      createPlannerComment(taskId, content),
    onSuccess: () => {
      setCommentText("")
      queryClient.invalidateQueries({ queryKey: ["planner-comments", task?.id] })
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deletePlannerComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-comments", task?.id] })
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
    },
  })

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !commentText.trim()) return
    addCommentMutation.mutate({ taskId: task.id, content: commentText.trim() })
  }

  if (!task) return null

  const priorityMeta = PRIORITY_META[task.priority]
  const overdue = isTaskOverdue(task.due_date, task.status)
  const assignees = task.assignees || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border pr-12 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {task.task_code}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                priorityMeta.badgeClass
              )}
            >
              <Flag className="h-3 w-3" />
              <span>{priorityMeta.label}</span>
            </span>
            {task.channel && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Radio className="h-3 w-3" />
                <span>{task.channel}</span>
              </Badge>
            )}
          </div>

          <SheetTitle className="text-lg font-bold leading-snug text-foreground">
            {task.title}
          </SheetTitle>
          {task.subtitle && (
            <SheetDescription className="text-xs text-muted-foreground">
              {task.subtitle}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              className="gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Detail</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(task)}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Tugas</span>
            </Button>
          </div>

          {/* Inline Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/25">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Status</label>
              <Select
                value={task.status}
                onValueChange={(val) => {
                  if (val && val !== task.status) {
                    onInlineUpdate(task.id, { status: val as PlannerTaskStatus })
                  }
                }}
              >
                <SelectTrigger size="sm" aria-label="Ubah status tugas">
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Prioritas</label>
              <Select
                value={task.priority}
                onValueChange={(val) => {
                  if (val && val !== task.priority) {
                    onInlineUpdate(task.id, { priority: val as PlannerTaskPriority })
                  }
                }}
              >
                <SelectTrigger size="sm" aria-label="Ubah prioritas tugas">
                  <SelectValue>{PRIORITY_META[task.priority].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLANNER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metadata Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Jadwal Pengerjaan</p>
                <p className={cn("text-muted-foreground", overdue && "text-rose-700 font-semibold")}>
                  Mulai: {task.start_date ? formatDateID(task.start_date) : "Belum ditentukan"} |{" "}
                  Tenggat: {task.due_date ? formatDateID(task.due_date) : "Belum ditentukan"}
                  {overdue ? " (Terlambat)" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold text-foreground">Penanggung Jawab</p>
                {assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {assignees.map((assignee) => (
                      <span
                        key={assignee.profile_id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold inline-flex items-center justify-center">
                          {getInitials(assignee.profile?.full_name)}
                        </span>
                        <span>{assignee.profile?.full_name || "Anggota"}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Belum ada anggota yang ditugaskan.</p>
                )}
              </div>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-start gap-2.5">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">Label</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">Brief & Deskripsi</h3>
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {task.description?.trim() ? (
                task.description
              ) : (
                <span className="text-muted-foreground">
                  Belum ada catatan atau brief konten untuk tugas ini.
                </span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span>Diskusi ({comments.length})</span>
              </h3>
            </div>

            {isLoadingComments ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : isCommentsError ? (
              <p className="text-xs text-destructive">
                Gagal memuat komentar. Silakan muat ulang halaman.
              </p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Belum ada komentar. Mulai diskusi terkait progres atau revisi di bawah.
              </p>
            ) : (
              <div className="space-y-2.5">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-border bg-card p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                          {getInitials(comment.author?.full_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {comment.author?.full_name || "Pengguna"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTimeID(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        aria-label="Hapus komentar"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed pl-8">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="space-y-2 pt-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis catatan progres atau komentar..."
                rows={2}
                aria-label="Tulis komentar"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="gap-1.5"
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Kirim Komentar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
