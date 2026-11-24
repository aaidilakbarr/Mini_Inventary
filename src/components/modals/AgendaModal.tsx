import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReminderItem, CreateReminderPayload, ReminderPriority, ReminderStatus } from "@/types/database"

interface AgendaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ReminderItem | null
  onSubmit: (payload: CreateReminderPayload) => Promise<void>
}

const STATUS_LABELS: Record<ReminderStatus, string> = {
  Upcoming: "Mendatang",
  "Due Today": "Hari Ini",
  Overdue: "Terlambat",
  Completed: "Selesai",
  Dismissed: "Diabaikan",
}

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  inventory: "Perawatan Aset",
  Inventaris: "Inventaris",
  Peminjaman: "Peminjaman",
  Langganan: "Langganan",
  Perawatan: "Perawatan",
}

const PRIORITY_OPTIONS: Array<{
  value: ReminderPriority
  label: string
  activeClass: string
  icon: React.ElementType
}> = [
  {
    value: "Rendah",
    label: "Rendah",
    activeClass: "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
    icon: CheckCircle2,
  },
  {
    value: "Sedang",
    label: "Sedang",
    activeClass: "border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock,
  },
  {
    value: "Tinggi",
    label: "Tinggi",
    activeClass: "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15",
    icon: AlertTriangle,
  },
]

export function AgendaModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: AgendaModalProps) {
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
      setFormData({
        title: "",
        description: "",
        source_type: "manual",
        due_date: d.toISOString().split("T")[0],
        priority: "Sedang",
        status: "Upcoming",
      })
    }
    setErrorMsg("")
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setErrorMsg("Judul agenda wajib diisi.")
      return
    }
    if (!formData.due_date) {
      setErrorMsg("Tanggal jatuh tempo wajib diisi.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit(formData)
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan agenda.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Agenda" : "Tambah Agenda"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
          {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="agenda-title" className="text-xs">
              Judul Agenda <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agenda-title"
              placeholder="Contoh: Servis rutin proyektor ruang rapat"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agenda-description" className="text-xs">Deskripsi & Catatan</Label>
            <Textarea
              id="agenda-description"
              rows={3}
              placeholder="Detail tindakan, lokasi, atau penanggung jawab (opsional)"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Prioritas</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = formData.priority === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, priority: opt.value })}
                    className={cn("h-10 gap-1.5", isSelected && opt.activeClass)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{opt.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Jatuh Tempo <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={formData.due_date}
                onChange={(date) => setFormData({ ...formData, due_date: date })}
                placeholder="Pilih tanggal"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sumber</Label>
              <Select
                value={formData.source_type || "manual"}
                onValueChange={(val) => setFormData({ ...formData, source_type: val || "manual" })}
              >
                <SelectTrigger>
                  <SelectValue>{SOURCE_LABELS[formData.source_type || "manual"] || formData.source_type}</SelectValue>
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
          </div>

          {initialData && (
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={formData.status || "Upcoming"}
                onValueChange={(val) => setFormData({ ...formData, status: (val as ReminderStatus) || "Upcoming" })}
              >
                <SelectTrigger>
                  <SelectValue>{STATUS_LABELS[formData.status || "Upcoming"]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Buat Agenda"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
