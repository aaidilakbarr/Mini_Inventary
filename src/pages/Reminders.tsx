import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Check, 
  Edit2, 
  Trash2, 
  Loader2, 
  Bell, 
  RefreshCw 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { ReminderItem, CreateReminderPayload } from "@/types/database"

export function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ReminderItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchReminders()
      setReminders(data)
    } catch (err) {
      console.error("Gagal memuat pengingat:", err)
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

  const handleSubmit = async (payload: CreateReminderPayload) => {
    if (editingItem) {
      await updateReminder(editingItem.id, payload)
    } else {
      await createReminder(payload)
    }
    await loadData()
  }

  const handleComplete = async (id: string) => {
    try {
      await updateReminderStatus(id, "Completed")
      await loadData()
    } catch (err) {
      console.error("Gagal menandai selesai pengingat:", err)
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

  const filtered = reminders.filter((r) => {
    const matchesSource = 
      sourceFilter === "Semua" || 
      r.source_type.toLowerCase() === sourceFilter.toLowerCase()
    
    let matchesStatus = true
    if (statusFilter === "Hari Ini") matchesStatus = r.status === "Due Today"
    else if (statusFilter === "Terlambat") matchesStatus = r.status === "Overdue"
    else if (statusFilter === "Mendatang") matchesStatus = r.status === "Upcoming"
    else if (statusFilter === "Selesai") matchesStatus = r.status === "Completed"

    return matchesSource && matchesStatus
  })

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Pusat Pengingat Terpadu</h1>
          <p className="text-xs text-muted-foreground">
            Pelacakan tanggal terintegrasi untuk garansi aset, tenggat peminjaman, dan perpanjangan langganan.
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
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Pengingat</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">Sumber:</span>
            {["Semua", "Langganan", "Peminjaman", "Inventaris", "Perawatan", "Manual"].map((source) => (
              <Button
                key={source}
                variant={sourceFilter === source ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter(source)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0 whitespace-nowrap"
              >
                {source}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">Status:</span>
            {["Semua", "Mendatang", "Hari Ini", "Terlambat", "Selesai"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="h-7 text-xs px-2.5 rounded-md text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap"
              >
                {st}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[760px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Sumber</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Judul & Deskripsi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tenggat Waktu</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Prioritas</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">Memuat data pengingat...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Bell className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada pengingat ditemukan</p>
                      <p className="text-[11px]">Tambahkan pengingat baru untuk melacak jadwal penting.</p>
                      <Button size="sm" variant="outline" onClick={handleOpenAdd} className="h-7 text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> Buat Pengingat
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono border-border/80 capitalize">
                        {item.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className={`font-semibold text-xs ${item.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.description || "-"}</p>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono">
                      <span className={
                        item.status === "Overdue" ? "text-destructive font-bold" :
                        item.status === "Due Today" ? "text-amber-600 font-bold" :
                        "text-muted-foreground"
                      }>
                        {formatDate(item.due_date)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      <span className={
                        item.priority === "Tinggi" ? "text-destructive font-semibold" :
                        item.priority === "Sedang" ? "text-amber-600 font-medium" :
                        "text-muted-foreground"
                      }>
                        {item.priority}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={
                          item.status === "Due Today" ? "secondary" :
                          item.status === "Overdue" ? "destructive" :
                          item.status === "Completed" ? "outline" : "default"
                        }
                        className="text-[10px] font-mono px-2 py-0 h-5"
                      >
                        {item.status === "Due Today" ? "Hari Ini" :
                         item.status === "Overdue" ? "Terlambat" :
                         item.status === "Completed" ? "Selesai" :
                         item.status === "Upcoming" ? "Mendatang" : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status !== "Completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(item.id)}
                            className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                            title="Tandai Selesai"
                          >
                            <Check className="h-3 w-3" />
                            <span>Selesai</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Reminder Modal */}
      <ReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Pengingat"
        description={`Apakah Anda yakin ingin menghapus pengingat "${deletingItem?.title}"?`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
