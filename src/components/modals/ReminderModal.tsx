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
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
              <Select
                value={formData.source_type || "manual"}
                onValueChange={(val) => setFormData({ ...formData, source_type: val as string })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="Inventaris">Inventaris</SelectItem>
                  <SelectItem value="Peminjaman">Peminjaman</SelectItem>
                  <SelectItem value="Langganan">Langganan</SelectItem>
                  <SelectItem value="Perawatan">Perawatan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val as ReminderPriority })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs font-semibold">Tanggal Jatuh Tempo *</Label>
              <DatePicker
                value={formData.due_date}
                onChange={(date) => setFormData({ ...formData, due_date: date })}
                placeholder="Pilih tgl jatuh tempo..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as ReminderStatus })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Mendatang (Upcoming)</SelectItem>
                  <SelectItem value="Due Today">Hari Ini (Due Today)</SelectItem>
                  <SelectItem value="Overdue">Terlambat (Overdue)</SelectItem>
                  <SelectItem value="Completed">Selesai (Completed)</SelectItem>
                  <SelectItem value="Dismissed">Diabaikan (Dismissed)</SelectItem>
                </SelectContent>
              </Select>
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
