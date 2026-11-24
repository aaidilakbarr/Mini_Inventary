import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  Eye,
  CalendarCheck2,
  Wrench,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AgendaModal } from "@/components/modals/AgendaModal"
import { AgendaDetailModal } from "@/components/modals/AgendaDetailModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { getAgendaUrgency } from "@/lib/agenda"
import {
  fetchReminders,
  createReminder,
  updateReminder,
  updateReminderStatus,
  deleteReminder,
} from "@/lib/api/reminders"
import { cn } from "@/lib/utils"
import type { ReminderItem, CreateReminderPayload, ReminderStatus } from "@/types/database"

const SHORT_MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]

const SOURCE_LABELS: Record<string, string> = {
  all: "Semua Sumber",
  inventory: "Perawatan Aset",
  manual: "Manual",
  Inventaris: "Inventaris",
  Peminjaman: "Peminjaman",
  Langganan: "Langganan",
  Perawatan: "Perawatan",
}

function parseDatePill(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: "--", month: "---" }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: SHORT_MONTHS[d.getMonth()],
  }
}

export function AgendaPage() {
  const [agendaItems, setAgendaItems] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState("Semua")
  const [sourceFilter, setSourceFilter] = useState("all")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null)

  const [detailItem, setDetailItem] = useState<ReminderItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ReminderItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const data = await fetchReminders()
      setAgendaItems(data)
    } catch (err: any) {
      console.error("Gagal memuat data agenda:", err)
      setLoadError(err?.message || "Gagal memuat daftar agenda. Periksa koneksi lalu coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async (payload: CreateReminderPayload) => {
    if (editingItem) {
      await updateReminder(editingItem.id, payload)
    } else {
      await createReminder(payload)
    }
    await loadData()
  }

  const handleToggleStatus = async (item: ReminderItem) => {
    const nextStatus: ReminderStatus = item.status === "Completed" ? "Upcoming" : "Completed"
    try {
      setTogglingId(item.id)
      await updateReminderStatus(item.id, nextStatus)
      await loadData()
      if (detailItem && detailItem.id === item.id) {
        setDetailItem({ ...detailItem, status: nextStatus, updated_at: new Date().toISOString() })
      }
    } catch (err: any) {
      console.error("Gagal memperbarui status agenda:", err)
      setLoadError(err?.message || "Gagal memperbarui status agenda.")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteReminder(deletingItem.id)
      setIsDeleteDialogOpen(false)
      if (detailItem?.id === deletingItem.id) {
        setIsDetailOpen(false)
        setDetailItem(null)
      }
      setDeletingItem(null)
      await loadData()
    } catch (err: any) {
      console.error("Gagal menghapus agenda:", err)
      setLoadError(err?.message || "Gagal menghapus agenda.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenDetail = (item: ReminderItem) => {
    setDetailItem(item)
    setIsDetailOpen(true)
  }

  const handleOpenEdit = (item: ReminderItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item: ReminderItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFilterTab("Semua")
    setSourceFilter("all")
  }

  const stats = useMemo(() => {
    let overdue = 0
    let dueToday = 0
    let highPriority = 0
    let active = 0
    let repairActive = 0
    let completed = 0

    for (const item of agendaItems) {
      const urgency = getAgendaUrgency(item)
      if (item.status === "Completed") {
        completed++
      } else {
        active++
        if (item.source_type === "inventory") repairActive++
        if (item.priority === "Tinggi") highPriority++
        if (urgency.state === "overdue") overdue++
        if (urgency.state === "today") dueToday++
      }
    }

    const total = agendaItems.length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { overdue, dueToday, highPriority, active, repairActive, completed, total, completionPct }
  }, [agendaItems])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const urgencyRank: Record<string, number> = {
      overdue: 0,
      today: 1,
      soon: 2,
      upcoming: 3,
      dismissed: 4,
      completed: 5,
    }

    return agendaItems
      .filter((item) => {
        const matchesSearch =
          !q ||
          item.title.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.source_type || "").toLowerCase().includes(q)

        const matchesSource =
          sourceFilter === "all" || (item.source_type || "manual") === sourceFilter

        const urgency = getAgendaUrgency(item)
        let matchesTab = true
        if (filterTab === "Terlambat") matchesTab = urgency.state === "overdue"
        else if (filterTab === "Hari Ini") matchesTab = urgency.state === "today"
        else if (filterTab === "Mendatang") matchesTab = urgency.state === "soon" || urgency.state === "upcoming"
        else if (filterTab === "Prioritas Tinggi") matchesTab = item.priority === "Tinggi" && item.status !== "Completed"
        else if (filterTab === "Selesai") matchesTab = item.status === "Completed"

        return matchesSearch && matchesSource && matchesTab
      })
      .sort((a, b) => {
        const ua = getAgendaUrgency(a)
        const ub = getAgendaUrgency(b)
        if (urgencyRank[ua.state] !== urgencyRank[ub.state]) {
          return urgencyRank[ua.state] - urgencyRank[ub.state]
        }
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
  }, [agendaItems, searchTerm, sourceFilter, filterTab])

  const hasActiveFilters = Boolean(searchTerm.trim()) || filterTab !== "Semua" || sourceFilter !== "all"
  const filterTabs = ["Semua", "Terlambat", "Hari Ini", "Mendatang", "Prioritas Tinggi", "Selesai"]

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
            Agenda
          </h1>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {filtered.length} jadwal
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin")} />
            <span>Segarkan</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Agenda</span>
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button type="button" variant="outline" size="xs" onClick={loadData}>
            Coba Lagi
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        <Card
          className={cn(
            "sm:col-span-2 lg:col-span-5",
            stats.overdue > 0 && "border-destructive/35"
          )}
        >
          <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Perlu Perhatian</p>
                <p className={cn("text-2xl font-extrabold tabular-nums mt-0.5", stats.overdue > 0 ? "text-destructive" : "text-foreground")}>
                  {stats.overdue + stats.dueToday}
                </p>
              </div>
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  stats.overdue > 0
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-amber-600 text-white"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.overdue > 0 && (
                <Badge variant="destructive">{stats.overdue} terlambat</Badge>
              )}
              {stats.dueToday > 0 && (
                <Badge variant="warning">{stats.dueToday} hari ini</Badge>
              )}
              {stats.highPriority > 0 && (
                <Badge variant="outline">{stats.highPriority} prioritas tinggi</Badge>
              )}
              {stats.overdue === 0 && stats.dueToday === 0 && stats.highPriority === 0 && (
                <Badge variant="success">Semua jadwal terkendali</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Agenda Aktif</p>
                <p className="text-2xl font-extrabold text-foreground tabular-nums mt-0.5">
                  {stats.active}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Wrench className="h-3 w-3 text-amber-600" />
                {stats.repairActive} perawatan
              </span>
              <span>·</span>
              <span>{Math.max(0, stats.active - stats.repairActive)} operasional</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Selesai</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {stats.completed}
                  </p>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    /{stats.total}
                  </span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 animate-bar"
                  style={{ width: `${stats.completionPct}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {stats.completionPct}% selesai
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari judul atau catatan agenda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-10 sm:h-9"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Hapus kata kunci"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <Select value={sourceFilter} onValueChange={(val) => setSourceFilter(val || "all")}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-9" aria-label="Filter sumber">
                  <SelectValue>{SOURCE_LABELS[sourceFilter] || sourceFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>

            <Tabs value={filterTab} onValueChange={(val) => setFilterTab(val || "Semua")}>
              <TabsList className="w-full lg:w-fit overflow-x-auto justify-start">
                {filterTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="flex-none">
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3" aria-label="Memuat agenda">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 py-1">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center gap-2.5 text-center">
            <CalendarCheck2 className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">
              {hasActiveFilters ? "Tidak ada agenda yang cocok" : "Belum ada jadwal agenda"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {hasActiveFilters
                ? "Ubah kata kunci pencarian atau reset filter untuk melihat jadwal lainnya."
                : "Buat agenda baru untuk melacak jadwal perawatan aset, audit, atau tenggat operasional."}
            </p>
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={resetFilters}>
                <X className="h-3.5 w-3.5" />
                <span>Reset Filter</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null)
                  setIsModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Agenda</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table className="min-w-[780px]">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 px-4 text-center text-xs font-semibold text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Jadwal & Agenda</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Tenggat</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Prioritas</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Sumber</TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const isDone = item.status === "Completed"
                    const urgency = getAgendaUrgency(item)
                    const { day, month } = parseDatePill(item.due_date)
                    const isBusy = togglingId === item.id

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "transition-colors duration-150",
                          isDone && "opacity-60",
                          urgency.state === "overdue" && "bg-destructive/[0.025]"
                        )}
                      >
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(item)}
                            aria-label={isDone ? `Tandai belum selesai: ${item.title}` : `Tandai selesai: ${item.title}`}
                            title={
                              isDone
                                ? "Tandai belum selesai"
                                : item.source_type === "inventory"
                                ? "Selesai servis (kembalikan ke stok)"
                                : "Tandai selesai"
                            }
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle
                                className={cn(
                                  "h-4 w-4",
                                  item.source_type === "inventory"
                                    ? "text-amber-600"
                                    : urgency.state === "overdue"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                          </Button>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-lg border flex flex-col items-center justify-center shrink-0 leading-none",
                                urgency.state === "overdue"
                                  ? "bg-destructive text-destructive-foreground border-destructive"
                                  : urgency.state === "today"
                                  ? "bg-amber-600 text-white border-amber-600"
                                  : urgency.state === "completed"
                                  ? "bg-emerald-700/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900"
                                  : "bg-muted/60 text-foreground border-border"
                              )}
                            >
                              <span className="text-xs font-extrabold tabular-nums">{day}</span>
                              <span className="text-[9px] font-bold tracking-wider opacity-85 mt-0.5">{month}</span>
                            </div>

                            <div className="min-w-0">
                              <Button
                                type="button"
                                variant="link"
                                onClick={() => handleOpenDetail(item)}
                                className={cn(
                                  "h-auto p-0 font-semibold text-xs text-left text-foreground hover:text-primary line-clamp-1 max-w-[300px] justify-start",
                                  isDone && "line-through text-muted-foreground"
                                )}
                              >
                                {item.title}
                              </Button>
                              {item.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[320px] mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge variant={urgency.badgeVariant}>
                            {urgency.state === "overdue" && <AlertTriangle className="h-3 w-3" />}
                            <span>{urgency.label}</span>
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            variant={
                              item.priority === "Tinggi"
                                ? "destructive"
                                : item.priority === "Sedang"
                                ? "warning"
                                : "outline"
                            }
                          >
                            {item.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3">
                          {item.source_type === "inventory" ? (
                            <Badge variant="warning">
                              <Wrench className="h-3 w-3" />
                              <span>Perawatan</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {SOURCE_LABELS[item.source_type || "manual"] || item.source_type || "Manual"}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenDetail(item)}
                              className="text-primary border-primary/25 hover:bg-primary/10 hover:text-primary"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Lihat Detail</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleOpenEdit(item)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Edit ${item.title}`}
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleOpenDelete(item)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Hapus ${item.title}`}
                              title="Hapus"
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

            <div className="md:hidden divide-y divide-border">
              {filtered.map((item) => {
                const isDone = item.status === "Completed"
                const urgency = getAgendaUrgency(item)
                const { day, month } = parseDatePill(item.due_date)
                const isBusy = togglingId === item.id

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 space-y-3 text-xs",
                      isDone && "opacity-65",
                      urgency.state === "overdue" && "bg-destructive/[0.025]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-lg border flex flex-col items-center justify-center shrink-0 leading-none",
                          urgency.state === "overdue"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : urgency.state === "today"
                            ? "bg-amber-600 text-white border-amber-600"
                            : urgency.state === "completed"
                            ? "bg-emerald-700/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-muted/60 text-foreground border-border"
                        )}
                      >
                        <span className="text-xs font-extrabold tabular-nums">{day}</span>
                        <span className="text-[9px] font-bold tracking-wider opacity-85 mt-0.5">{month}</span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("font-bold text-sm text-foreground break-words", isDone && "line-through text-muted-foreground")}>
                            {item.title}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(item)}
                            className="shrink-0"
                            aria-label={isDone ? `Tandai belum selesai: ${item.title}` : `Tandai selesai: ${item.title}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className={cn("h-4 w-4", item.source_type === "inventory" ? "text-amber-600" : "text-muted-foreground")} />
                            )}
                          </Button>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <Badge variant={urgency.badgeVariant}>{urgency.label}</Badge>
                          <Badge
                            variant={
                              item.priority === "Tinggi"
                                ? "destructive"
                                : item.priority === "Sedang"
                                ? "warning"
                                : "outline"
                            }
                          >
                            {item.priority}
                          </Badge>
                          {item.source_type === "inventory" ? (
                            <Badge variant="warning">
                              <Wrench className="h-3 w-3" />
                              <span>Perawatan</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {SOURCE_LABELS[item.source_type || "manual"] || item.source_type || "Manual"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDetail(item)}
                        className="flex-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Detail</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(item)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                        aria-label={`Hapus ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <AgendaDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        item={detailItem}
        onToggleStatus={handleToggleStatus}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        isToggling={Boolean(detailItem && togglingId === detailItem.id)}
      />

      <AgendaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        onSubmit={handleSave}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Agenda"
        description={`Hapus agenda "${deletingItem?.title}"?`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
