import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, CheckCircle2, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { fetchProfiles } from "@/lib/api/profiles"
import {
  computePlannerSummary,
  createPlannerTask,
  deletePlannerTask,
  fetchPlannerTasks,
  movePlannerTask,
  updatePlannerTask,
} from "@/lib/api/planner"
import {
  PlannerSummaryCards,
  type SummaryQuickFilter,
} from "@/components/planner/PlannerSummaryCards"
import { PlannerToolbar } from "@/components/planner/PlannerToolbar"
import { PlannerKanbanBoard } from "@/components/planner/PlannerKanbanBoard"
import { PlannerSpreadsheetView } from "@/components/planner/PlannerSpreadsheetView"
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView"
import { PlannerTimelineView } from "@/components/planner/PlannerTimelineView"
import { PlannerTaskModal } from "@/components/planner/PlannerTaskModal"
import { PlannerTaskDrawer } from "@/components/planner/PlannerTaskDrawer"
import {
  PRIORITY_WEIGHT,
  type PlannerSortKey,
  type PlannerViewMode,
} from "@/components/planner/plannerConfig"
import type {
  CreatePlannerTaskPayload,
  PlannerTask,
  PlannerTaskPriority,
  PlannerTaskStatus,
} from "@/types/database"

export function PlannerPage() {
  const queryClient = useQueryClient()

  // View & Filter state
  const [viewMode, setViewMode] = useState<PlannerViewMode>("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PlannerTaskStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<PlannerTaskPriority | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [quickFilter, setQuickFilter] = useState<SummaryQuickFilter | null>(null)
  const [sortBy, setSortBy] = useState<PlannerSortKey>("position")

  // Modal / Drawer / Delete state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
  const [defaultModalStatus, setDefaultModalStatus] =
    useState<PlannerTaskStatus>("Not Started")
  const [defaultModalDueDate, setDefaultModalDueDate] = useState<string>("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<PlannerTask | null>(null)

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const {
    data: tasks = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["planner-tasks"],
    queryFn: () => fetchPlannerTasks(),
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  })

  const summary = useMemo(() => computePlannerSummary(tasks), [tasks])

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [tasks, selectedTaskId]
  )

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (quickFilter === "in_progress") {
      result = result.filter(
        (t) => t.status === "Pending" || t.status === "Under Review"
      )
    } else if (quickFilter === "urgent") {
      result = result.filter(
        (t) => t.priority === "Urgent" && t.status !== "Completed"
      )
    } else if (quickFilter === "completed") {
      result = result.filter((t) => t.status === "Completed")
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    if (assigneeFilter !== "all") {
      result = result.filter((t) =>
        t.assignees?.some((a) => a.profile_id === assigneeFilter)
      )
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.task_code.toLowerCase().includes(q) ||
          (t.subtitle?.toLowerCase().includes(q) ?? false) ||
          (t.channel?.toLowerCase().includes(q) ?? false)
        )
      })
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "due_date": {
          const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
          const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
          return aTime - bTime
        }
        case "priority":
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title, "id")
        case "position":
        default:
          return a.position - b.position
      }
    })

    return result
  }, [tasks, quickFilter, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreatePlannerTaskPayload) => createPlannerTask(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
      setIsTaskModalOpen(false)
      setEditingTask(null)
      setFeedback({
        type: "success",
        message: `Tugas ${created.task_code} berhasil ditambahkan.`,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<CreatePlannerTaskPayload>
    }) => updatePlannerTask(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
      setIsTaskModalOpen(false)
      setEditingTask(null)
      setFeedback({
        type: "success",
        message: `Tugas ${updated.task_code} berhasil diperbarui.`,
      })
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Gagal memperbarui tugas planner.",
      })
    },
  })

  const moveMutation = useMutation({
    mutationFn: ({
      taskId,
      newStatus,
      newPosition,
    }: {
      taskId: string
      newStatus: PlannerTaskStatus
      newPosition: number
    }) => movePlannerTask(taskId, newStatus, newPosition),
    onMutate: async ({ taskId, newStatus, newPosition }) => {
      await queryClient.cancelQueries({ queryKey: ["planner-tasks"] })
      const previous = queryClient.getQueryData<PlannerTask[]>(["planner-tasks"])
      if (previous) {
        queryClient.setQueryData<PlannerTask[]>(
          ["planner-tasks"],
          previous.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
          )
        )
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["planner-tasks"], context.previous)
      }
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Gagal memindahkan status tugas.",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlannerTask(id),
    onSuccess: () => {
      const deletedCode = taskToDelete?.task_code || "tugas"
      if (selectedTaskId === taskToDelete?.id) {
        setSelectedTaskId(null)
      }
      setTaskToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["planner-tasks"] })
      setFeedback({
        type: "success",
        message: `Tugas ${deletedCode} berhasil dihapus.`,
      })
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus tugas.",
      })
    },
  })

  // Handlers
  const handleSelectQuickFilter = (filter: SummaryQuickFilter) => {
    if (filter === "all" || quickFilter === filter) {
      setQuickFilter(null)
      return
    }
    setQuickFilter(filter)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setAssigneeFilter("all")
    setQuickFilter(null)
  }

  const openCreateModal = (status: PlannerTaskStatus = "Not Started", dueDate = "") => {
    setEditingTask(null)
    setDefaultModalStatus(status)
    setDefaultModalDueDate(dueDate)
    setIsTaskModalOpen(true)
  }

  const openEditModal = (task: PlannerTask) => {
    setEditingTask(task)
    setDefaultModalStatus(task.status)
    setDefaultModalDueDate("")
    setIsTaskModalOpen(true)
  }

  const handleTaskFormSubmit = async (payload: CreatePlannerTaskPayload) => {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  const handleMoveTask = (
    taskId: string,
    newStatus: PlannerTaskStatus,
    newPosition: number
  ) => {
    moveMutation.mutate({ taskId, newStatus, newPosition })
  }

  const handleQuickStatusChange = (
    task: PlannerTask,
    newStatus: PlannerTaskStatus
  ) => {
    const targetCount = tasks.filter((t) => t.status === newStatus).length
    moveMutation.mutate({ taskId: task.id, newStatus, newPosition: targetCount })
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight text-foreground">
            Content Planner
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Pantau progres konten, atur prioritas, dan kelola tenggat waktu tim dalam satu papan.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto gap-1.5 bg-card h-9"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Tutup notifikasi"
            className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Summary Row */}
      <PlannerSummaryCards
        summary={summary}
        isLoading={isLoading}
        activeQuickFilter={quickFilter}
        onSelectQuickFilter={handleSelectQuickFilter}
      />

      {/* Toolbar: View Switcher + Filter + Sort + Create */}
      <PlannerToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        profiles={profiles}
        onResetFilters={handleResetFilters}
        onCreateTask={() => openCreateModal()}
      />

      {/* Error State */}
      {isError ? (
        <Alert
          variant="destructive"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Gagal memuat data Planner dari Supabase.</p>
            <p className="text-muted-foreground mt-0.5">
              {error instanceof Error
                ? error.message
                : "Pastikan migrasi tabel planner_tasks sudah dijalankan di Supabase."}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </Alert>
      ) : (
        <>
          {viewMode === "kanban" && (
            <PlannerKanbanBoard
              tasks={filteredTasks}
              isLoading={isLoading}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onEditTask={openEditModal}
              onDeleteTask={setTaskToDelete}
              onCreateInColumn={(status) => openCreateModal(status)}
              onMoveTask={handleMoveTask}
            />
          )}

          {viewMode === "spreadsheet" && (
            <PlannerSpreadsheetView
              tasks={filteredTasks}
              isLoading={isLoading}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onEditTask={openEditModal}
              onDeleteTask={setTaskToDelete}
              onQuickStatusChange={handleQuickStatusChange}
              onCreateTask={() => openCreateModal()}
            />
          )}

          {viewMode === "calendar" && (
            <PlannerCalendarView
              tasks={filteredTasks}
              isLoading={isLoading}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onCreateTaskOnDate={(dateStr) => openCreateModal("Not Started", dateStr)}
            />
          )}

          {viewMode === "timeline" && (
            <PlannerTimelineView
              tasks={filteredTasks}
              isLoading={isLoading}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onCreateTask={() => openCreateModal()}
            />
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <PlannerTaskModal
        key={`${editingTask?.id ?? "new"}-${defaultModalStatus}-${defaultModalDueDate}-${isTaskModalOpen}`}
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          setIsTaskModalOpen(open)
          if (!open) setEditingTask(null)
        }}
        initialTask={editingTask}
        defaultStatus={defaultModalStatus}
        defaultDueDate={defaultModalDueDate}
        profiles={profiles}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleTaskFormSubmit}
      />

      {/* Task Detail Side Drawer */}
      <PlannerTaskDrawer
        task={selectedTask}
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null)
        }}
        onEdit={(task) => openEditModal(task)}
        onDelete={(task) => setTaskToDelete(task)}
        onInlineUpdate={(taskId, patch) => {
          updateMutation.mutate({ id: taskId, payload: patch })
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null)
        }}
        title={`Hapus ${taskToDelete?.task_code || "Tugas"}?`}
        description={`Tugas "${taskToDelete?.title || ""}" beserta seluruh komentarnya akan dihapus permanen.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (taskToDelete) {
            deleteMutation.mutate(taskToDelete.id)
          }
        }}
      />
    </div>
  )
}
