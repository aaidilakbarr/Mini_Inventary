import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Loader2,
  BellRing
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { ReminderModal } from "@/components/modals/ReminderModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import {
  fetchReminders,
  createReminder,
  updateReminder,
  updateReminderStatus,
  deleteReminder
} from "@/lib/api/reminders"
import { formatDateID } from "@/lib/formatters"
import type { ReminderItem, CreateReminderPayload, ReminderStatus } from "@/types/database"

export function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState("Semua")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null)

  // Delete dialog states
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

  const handleOpenAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: ReminderItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item: ReminderItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

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

  // Filter items
  const filtered = reminders.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase())

    let matchesTab = true
    if (filterTab === "Mendatang") matchesTab = item.status === "Upcoming" || item.status === "Due Today"
    else if (filterTab === "Prioritas Tinggi") matchesTab = item.priority === "Tinggi"
    else if (filterTab === "Selesai") matchesTab = item.status === "Completed"
    else if (filterTab === "Terlambat") matchesTab = item.status === "Overdue"

    return matchesSearch && matchesTab
  })

  // Quick stats
  const activeCount = reminders.filter(r => r.status !== 'Completed').length
  const highPriorityCount = reminders.filter(r => r.priority === 'Tinggi' && r.status !== 'Completed').length
  const completedCount = reminders.filter(r => r.status === 'Completed').length

  const filterTabs = ["Semua", "Mendatang", "Prioritas Tinggi", "Terlambat", "Selesai"]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Pengingat & Agenda</h1>
          <p className="text-xs text-muted-foreground">
            Pusat notifikasi jadwal pemeliharaan aset, tagihan lisensi, dan agenda penting internal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-8 text-xs font-medium gap-1.5 border-border/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Pengingat</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Agenda Aktif / Menunggu</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {activeCount} <span className="text-xs font-normal text-muted-foreground">Item</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Prioritas Tinggi</p>
              <p className="text-lg font-bold font-mono text-destructive mt-0.5">
                {highPriorityCount} <span className="text-xs font-normal text-muted-foreground">Penting</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Telah Selesai</p>
              <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                {completedCount} <span className="text-xs font-normal text-muted-foreground">Tuntas</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari judul pengingat atau keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {filterTabs.map((tab) => (
              <Button
                key={tab}
                variant={filterTab === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTab(tab)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0 whitespace-nowrap"
              >
                {tab}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Reminders Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[700px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-12 text-center h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Agenda / Pengingat</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Prioritas</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Jatuh Tempo</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Sumber</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">Memuat pengingat...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BellRing className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada agenda pengingat</p>
                      <p className="text-[11px]">Belum ada jadwal yang tercatat atau cocok dengan filter.</p>
                      <Button size="sm" variant="outline" onClick={handleOpenAdd} className="h-7 text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> Buat Pengingat Baru
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const isDone = item.status === "Completed"
                  return (
                    <TableRow key={item.id} className={`border-border/50 hover:bg-muted/30 ${isDone ? "opacity-60 bg-muted/20" : ""}`}>
                      <TableCell className="text-center py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="hover:scale-110 transition-transform focus:outline-none"
                          title={isDone ? "Tandai Belum Selesai" : "Tandai Selesai"}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/60 hover:border-primary" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className={`font-semibold text-xs text-foreground ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            item.priority === "Tinggi" ? "destructive" :
                            item.priority === "Sedang" ? "secondary" : "outline"
                          }
                          className="text-[10px] font-mono px-2 py-0 h-5"
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateID(item.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px] font-mono capitalize px-2 py-0 h-5">
                          {item.source_type || "manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Pengingat"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Pengingat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Reminder Modal */}
      <ReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        onSubmit={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Pengingat"
        description={`Apakah Anda yakin ingin menghapus agenda "${deletingItem?.title}"?`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
