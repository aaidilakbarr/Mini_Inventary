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
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumberID } from "@/lib/formatters"
import type {
  SubscriptionItem,
  CreateSubscriptionPayload,
  Category,
  BillingCycle,
  SubscriptionStatus,
} from "@/types/database"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: SubscriptionItem | null
  categories: Category[]
  onSubmit: (payload: CreateSubscriptionPayload) => Promise<void>
}

const CYCLE_LABELS: Record<BillingCycle, string> = {
  Monthly: "Bulanan",
  Quarterly: "Kuartalan",
  "Semi-Annually": "Semester",
  Yearly: "Tahunan",
  Custom: "Kustom",
}

const STATUS_OPTIONS: Array<{ value: SubscriptionStatus; label: string; dot: string }> = [
  { value: "Active", label: "Aktif", dot: "bg-emerald-500" },
  { value: "Past Due", label: "Jatuh Tempo", dot: "bg-destructive" },
  { value: "Cancelled", label: "Dibatalkan", dot: "bg-muted-foreground" },
  { value: "Expired", label: "Kedaluwarsa", dot: "bg-amber-500" },
]

export function SubscriptionModal({
  open,
  onOpenChange,
  initialData,
  categories,
  onSubmit,
}: SubscriptionModalProps) {
  const [formData, setFormData] = useState<CreateSubscriptionPayload>({
    service_name: "",
    provider: "",
    category_id: "",
    cost: 0,
    billing_cycle: "Monthly",
    start_date: "",
    next_billing_date: "",
    payment_method: "",
    status: "Active",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (initialData) {
      setFormData({
        service_name: initialData.service_name || "",
        provider: initialData.provider || "",
        category_id: initialData.category_id || "",
        cost: initialData.cost || 0,
        billing_cycle: initialData.billing_cycle || "Monthly",
        start_date: initialData.start_date ? initialData.start_date.split("T")[0] : "",
        next_billing_date: initialData.next_billing_date ? initialData.next_billing_date.split("T")[0] : "",
        payment_method: initialData.payment_method || "",
        status: initialData.status || "Active",
        notes: initialData.notes || "",
      })
    } else {
      const today = new Date().toISOString().split("T")[0]
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setFormData({
        service_name: "",
        provider: "",
        category_id: categories[0]?.id || "",
        cost: 0,
        billing_cycle: "Monthly",
        start_date: today,
        next_billing_date: nextMonth.toISOString().split("T")[0],
        payment_method: "",
        status: "Active",
        notes: "",
      })
    }
    setErrorMsg("")
  }, [open, initialData, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service_name.trim()) {
      setErrorMsg("Nama layanan wajib diisi.")
      return
    }
    if (!formData.next_billing_date) {
      setErrorMsg("Tanggal tagihan berikutnya wajib diisi.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit({
        ...formData,
        service_name: formData.service_name.trim(),
        provider: formData.provider?.trim() || null,
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        cost: Number(formData.cost) || 0,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan langganan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.service_name.trim()) {
      setErrorMsg("Isi nama layanan untuk menyimpan draf.")
      return
    }
    try {
      setIsSubmitting(true)
      setErrorMsg("")
      const today = new Date().toISOString().split("T")[0]
      await onSubmit({
        ...formData,
        service_name: formData.service_name.trim(),
        provider: formData.provider?.trim() || null,
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        cost: Number(formData.cost) || 0,
        next_billing_date: formData.next_billing_date || today,
        status: "Active",
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan draf.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCatLabel =
    formData.category_id && formData.category_id !== "none"
      ? categories.find((c) => c.id === formData.category_id)?.name || "Kategori"
      : "Tanpa Kategori"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Langganan" : "Tambah Langganan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
          {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="service_name" className="text-xs">
                Nama Layanan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service_name"
                placeholder="Nama layanan atau lisensi"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-xs">Penyedia</Label>
              <Input
                id="provider"
                placeholder="Nama vendor (opsional)"
                value={formData.provider || ""}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : val })
                }
              >
                <SelectTrigger>
                  <SelectValue>{selectedCatLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_method" className="text-xs">Metode Pembayaran</Label>
              <Input
                id="payment_method"
                placeholder="Kartu kredit, VA, dll."
                value={formData.payment_method || ""}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Biaya (IDR)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.cost ? formatNumberID(formData.cost) : ""}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "")
                    setFormData({ ...formData, cost: rawVal ? Number(rawVal) : 0 })
                  }}
                  className="pl-9 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Siklus</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(val) => setFormData({ ...formData, billing_cycle: (val as BillingCycle) || "Monthly" })}
              >
                <SelectTrigger>
                  <SelectValue>{CYCLE_LABELS[formData.billing_cycle]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CYCLE_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Tagihan Berikutnya <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={formData.next_billing_date}
                onChange={(date) => setFormData({ ...formData, next_billing_date: date })}
                placeholder="Pilih tanggal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Mulai</Label>
              <DatePicker
                value={formData.start_date || ""}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                placeholder="Pilih tanggal"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Catatan</Label>
              <Input
                id="notes"
                placeholder="Catatan lisensi (opsional)"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = formData.status === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setFormData({ ...formData, status: opt.value })}
                    className={cn(
                      "rounded-full h-7 px-3 gap-1.5",
                      isSelected && "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    )}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSubmitting}>
                Simpan Draf
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{initialData ? "Simpan" : "Tambah Langganan"}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
