import {
  Kanban,
  GanttChartSquare,
  Table2,
  CalendarDays,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  PLANNER_PRIORITIES,
  PLANNER_STATUSES,
  PRIORITY_META,
  STATUS_META,
  type PlannerSortKey,
  type PlannerViewMode,
} from "./plannerConfig"
import type { PlannerTaskPriority, PlannerTaskStatus } from "@/types/database"
import type { UserProfile } from "@/types/auth"

interface PlannerToolbarProps {
  viewMode: PlannerViewMode
  onViewModeChange: (mode: PlannerViewMode) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: PlannerTaskStatus | "all"
  onStatusFilterChange: (value: PlannerTaskStatus | "all") => void
  priorityFilter: PlannerTaskPriority | "all"
  onPriorityFilterChange: (value: PlannerTaskPriority | "all") => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  sortBy: PlannerSortKey
  onSortByChange: (value: PlannerSortKey) => void
  profiles: UserProfile[]
  onResetFilters: () => void
  onCreateTask: () => void
}

const VIEW_TABS: Array<{ id: PlannerViewMode; label: string; icon: typeof Kanban }> = [
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "timeline", label: "Timeline", icon: GanttChartSquare },
  { id: "spreadsheet", label: "Spreadsheet", icon: Table2 },
  { id: "calendar", label: "Kalender", icon: CalendarDays },
]

const SORT_LABELS: Record<PlannerSortKey, string> = {
  position: "Urutan Papan",
  due_date: "Tenggat Terdekat",
  priority: "Prioritas Tertinggi",
  created_at: "Terbaru Dibuat",
  title: "Judul (A-Z)",
}

export function PlannerToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  sortBy,
  onSortByChange,
  profiles,
  onResetFilters,
  onCreateTask,
}: PlannerToolbarProps) {
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (assigneeFilter !== "all" ? 1 : 0)

  const hasAnyFilter = activeFilterCount > 0 || searchQuery.trim() !== ""

  const selectedAssigneeName =
    assigneeFilter !== "all"
      ? profiles.find((p) => p.id === assigneeFilter)?.full_name || "Anggota"
      : null

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* View Switcher */}
        <div
          role="tablist"
          aria-label="Mode tampilan planner"
          className="inline-flex items-center p-1 rounded-xl border border-border bg-muted/60 overflow-x-auto max-w-full"
        >
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = viewMode === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onViewModeChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 h-9 sm:h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial sm:w-56 min-w-[180px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari kode, judul, kanal..."
              aria-label="Cari tugas planner"
              className="h-10 sm:h-9 pl-8 pr-8 bg-card text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 sm:h-9 gap-1.5 bg-card"
                />
              }
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="solid" className="h-4 min-w-4 px-1 text-[10px] font-mono">
                  {activeFilterCount}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Filter Tugas</span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Reset semua
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => onStatusFilterChange((v as PlannerTaskStatus | "all") || "all")}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {PLANNER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Prioritas
                </label>
                <Select
                  value={priorityFilter}
                  onValueChange={(v) =>
                    onPriorityFilterChange((v as PlannerTaskPriority | "all") || "all")
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Semua Prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Prioritas</SelectItem>
                    {PLANNER_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_META[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Penanggung Jawab
                </label>
                <Select
                  value={assigneeFilter}
                  onValueChange={(v) => onAssigneeFilterChange(v || "all")}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Semua Anggota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Anggota</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Select */}
          <Select
            value={sortBy}
            onValueChange={(v) => onSortByChange((v as PlannerSortKey) || "position")}
          >
            <SelectTrigger
              aria-label="Urutkan tugas"
              className="h-10 sm:h-9 w-auto min-w-[148px] bg-card gap-1.5"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(SORT_LABELS) as PlannerSortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Primary Action */}
          <Button
            type="button"
            size="sm"
            onClick={onCreateTask}
            className="h-10 sm:h-9 px-3.5 gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Tugas Baru</span>
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1">Filter aktif:</span>
          {statusFilter !== "all" && (
            <Badge variant="outline" className="gap-1 bg-card pr-1 text-[11px]">
              <span>Status: {STATUS_META[statusFilter].label}</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                aria-label="Hapus filter status"
                className="rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priorityFilter !== "all" && (
            <Badge variant="outline" className="gap-1 bg-card pr-1 text-[11px]">
              <span>Prioritas: {PRIORITY_META[priorityFilter].label}</span>
              <button
                type="button"
                onClick={() => onPriorityFilterChange("all")}
                aria-label="Hapus filter prioritas"
                className="rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedAssigneeName && (
            <Badge variant="outline" className="gap-1 bg-card pr-1 text-[11px]">
              <span>PIC: {selectedAssigneeName}</span>
              <button
                type="button"
                onClick={() => onAssigneeFilterChange("all")}
                aria-label="Hapus filter penanggung jawab"
                className="rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchQuery.trim() !== "" && (
            <Badge variant="outline" className="gap-1 bg-card pr-1 text-[11px]">
              <span>Cari: "{searchQuery.trim()}"</span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Hapus kata kunci pencarian"
                className="rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-primary hover:underline ml-1 cursor-pointer"
          >
            Bersihkan semua
          </button>
        </div>
      )}
    </div>
  )
}
