import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  Loader2,
  BellRing,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReminderModal } from "@/components/modals/ReminderModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import {
  fetchReminders,
  createReminder,
  updateReminder,
  updateReminderStatus,
  deleteReminder,
} from "@/lib/api/reminders"
import { formatDateID } from "@/lib/formatters"
import type { ReminderItem, CreateReminderPayload, ReminderStatus } from "@/types/database"

export function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState("Semua")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ReminderItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchReminders()
      setReminders(data)
    } catch (err) {
      console.error("Gagal memuat data pengingat:", err)
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
      await updateReminderStatus(item.id, nextStatus)
      await loadData()
    } catch (err) {
      console.error("Gagal memperbarui status pengingat:", err)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteReminder(deletingItem.id)
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      await loadData()
    } catch (err) {
      console.error("Gagal menghapus pengingat:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = reminders.filter((item) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)

    let matchesTab = true
    if (filterTab === "Mendatang") matchesTab = item.status === "Upcoming" || item.status === "Due Today"
    else if (filterTab === "Prioritas Tinggi") matchesTab = item.priority === "Tinggi"
    else if (filterTab === "Selesai") matchesTab = item.status === "Completed"
    else if (filterTab === "Terlambat") matchesTab = item.status === "Overdue"

    return matchesSearch && matchesTab
  })

  const activeCount = reminders.filter((r) => r.status !== "Completed").length
  const highPriorityCount = reminders.filter((r) => r.priority === "Tinggi" && r.status !== "Completed").length
  const completedCount = reminders.filter((r) => r.status === "Completed").length

  const filterTabs = ["Semua", "Mendatang", "Prioritas Tinggi", "Terlambat", "Selesai"]

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
          Pengingat
        </h1>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
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
            <span>Tambah Pengingat</span>
          </Button>
        </div>
      </div>

      {/* Responsive KPI Strip: 2-col + 1 full-width on mobile, 3-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">{activeCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Prioritas Tinggi</p>
              <p className="text-lg font-extrabold text-destructive tabular-nums mt-0.5">{highPriorityCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Selesai</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                {completedCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari pengingat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 sm:h-9"
            />
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
        </CardContent>
      </Card>

      {/* Main Content: Desktop Table + Mobile Stacked Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs">Memuat pengingat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-6 text-center">
            <BellRing className="h-7 w-7 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">Tidak ada pengingat</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingItem(null)
                setIsModalOpen(true)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Pengingat</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table className="min-w-[680px]">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground">Selesai</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Agenda</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Prioritas</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Jatuh Tempo</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Sumber</TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const isDone = item.status === "Completed"
                    return (
                      <TableRow key={item.id} className={isDone ? "opacity-60" : ""}>
                        <TableCell className="text-center py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
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
                                className={`h-4 w-4 ${
                                  item.source_type === "inventory"
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                                }`}
                              />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className={`font-semibold text-xs text-foreground ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
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
                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDateID(item.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          {item.source_type === "inventory" ? (
                            <Badge variant="warning">
                              <Wrench className="h-3 w-3" />
                              <span>Perawatan</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {item.source_type || "manual"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingItem(item)
                                setIsModalOpen(true)
                              }}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setDeletingItem(item)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Hapus ${item.title}`}
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

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((item) => {
                const isDone = item.status === "Completed"
                return (
                  <div key={item.id} className={`p-4 space-y-3 text-xs ${isDone ? "opacity-65" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleToggleStatus(item)}
                        className="shrink-0 mt-0.5"
                        aria-label={isDone ? `Tandai belum selesai: ${item.title}` : `Tandai selesai: ${item.title}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className={`h-4 w-4 ${item.source_type === "inventory" ? "text-amber-600" : "text-muted-foreground"}`} />
                        )}
                      </Button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-bold text-sm text-foreground ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </p>
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
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDateID(item.due_date)}
                          </span>
                          {item.source_type === "inventory" ? (
                            <Badge variant="warning">
                              <Wrench className="h-3 w-3" />
                              <span>Perawatan</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {item.source_type || "manual"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item)
                          setIsModalOpen(true)
                        }}
                        className="flex-1"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          setDeletingItem(item)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
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

      <ReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        onSubmit={handleSave}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Pengingat"
        description={`Hapus pengingat "${deletingItem?.title}"?`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
