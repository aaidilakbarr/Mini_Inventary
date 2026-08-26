import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { ReminderItem, CreateReminderPayload, ReminderPriority, ReminderStatus } from "@/types/database"

interface ReminderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ReminderItem | null
  onSubmit: (payload: CreateReminderPayload) => Promise<void>
}

export function ReminderModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: ReminderModalProps) {
  const [formData, setFormData] = useState<CreateReminderPayload>({
    title: "",
    description: "",
    source_type: "manual",
    due_date: "",
    priority: "Sedang",
    status: "Upcoming",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        source_type: initialData.source_type || "manual",
        due_date: initialData.due_date ? initialData.due_date.split("T")[0] : "",
        priority: initialData.priority || "Sedang",
        status: initialData.status || "Upcoming",
      })
    } else {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      const formattedDate = d.toISOString().split("T")[0]

      setFormData({
        title: "",
        description: "",
        source_type: "manual",
        due_date: formattedDate,
        priority: "Sedang",
        status: "Upcoming",
      })
    }
    setErrorMsg("")
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setErrorMsg("Judul pengingat wajib diisi")
      return
    }
    if (!formData.due_date) {
      setErrorMsg("Tanggal tenggat waktu wajib diisi")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit(formData)
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan pengingat")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Pengingat" : "Tambah Pengingat Baru"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Perbarui tanggal jatuh tempo, judul, atau prioritas pengingat."
              : "Buat pengingat kustom untuk garansi, jadwal servis, atau agenda penting."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">Judul Pengingat *</Label>
            <Input
              id="title"
              placeholder="misal: Perawatan Rutin UPS Server"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Deskripsi</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="Detail instruksi atau rincian aset/layanan yang perlu ditindaklanjuti"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-input bg-background p-2 text-foreground outline-none focus:border-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="source_type" className="text-xs font-semibold">Kategori Sumber</Label>
              <select
                id="source_type"
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="manual">Manual</option>
                <option value="Inventaris">Inventaris</option>
                <option value="Peminjaman">Peminjaman</option>
                <option value="Langganan">Langganan</option>
                <option value="Perawatan">Perawatan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold">Prioritas</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ReminderPriority })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs font-semibold">Tanggal Jatuh Tempo *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ReminderStatus })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="Upcoming">Mendatang (Upcoming)</option>
                <option value="Due Today">Hari Ini (Due Today)</option>
                <option value="Overdue">Terlambat (Overdue)</option>
                <option value="Completed">Selesai (Completed)</option>
                <option value="Dismissed">Diabaikan (Dismissed)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Buat Pengingat"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
