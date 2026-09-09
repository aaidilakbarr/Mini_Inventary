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
import {
  CreditCard,
  Loader2,
  Plus
} from "lucide-react"
import { formatNumberID } from "@/lib/formatters"
import type {
  SubscriptionItem,
  CreateSubscriptionPayload,
  Category,
  BillingCycle
} from "@/types/database"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: SubscriptionItem | null
  categories: Category[]
  onSubmit: (payload: CreateSubscriptionPayload) => Promise<void>
}

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
      const nextBilling = nextMonth.toISOString().split("T")[0]

      setFormData({
        service_name: "",
        provider: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        cost: 0,
        billing_cycle: "Monthly",
        start_date: today,
        next_billing_date: nextBilling,
        payment_method: "Kartu Kredit",
        status: "Active",
        notes: "",
      })
    }
    setErrorMsg("")
  }, [open, initialData, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service_name.trim()) {
      setErrorMsg("Nama Layanan / Software wajib diisi.")
      return
    }
    if (!formData.next_billing_date) {
      setErrorMsg("Tanggal jatuh tempo tagihan berikutnya wajib diisi.")
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
      console.error("Gagal menyimpan langganan:", err)
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data langganan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.service_name.trim()) {
      setErrorMsg("Harap isi setidaknya Nama Layanan untuk menyimpan draf langganan.")
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
      console.error("Gagal menyimpan draf:", err)
      setErrorMsg(err.message || "Gagal menyimpan draf langganan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl">
        {/* Header - Layout persis modal tambah aset di inventaris */}
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {initialData ? "Ubah Data Langganan" : "Tambah Langganan Baru"}
                  </DialogTitle>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                    {initialData ? "Edit Langganan" : "Langganan Baru"}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Daftarkan layanan langganan atau lisensi software, kelola jadwal tagihan, dan pantau pengeluaran operasional.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Baris 1: Nama Layanan & Penyedia / Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service_name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Nama Layanan / Software <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="service_name"
                placeholder="Masukkan Layanan"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-xs font-semibold text-foreground">
                Penyedia
              </Label>
              <Input
                id="provider"
                placeholder="Masukkan Penyedia (Opsional)"
                value={formData.provider || ""}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Baris 2: Kategori & Metode Pembayaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Kategori Layanan
              </Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : val })
                }
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus:ring-blue-500/30">
                  <SelectValue placeholder="Pilih Kategori">
                    {formData.category_id && formData.category_id !== "none"
                      ? categories.find((c) => c.id === formData.category_id)?.name || "Pilih Kategori"
                      : "Pilih Kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Pilih Kategori --</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_method" className="text-xs font-semibold text-foreground">
                Metode Pembayaran
              </Label>
              <Input
                id="payment_method"
                placeholder="misal: Kartu Kredit Corp, BCA Virtual Account"
                value={formData.payment_method || ""}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Baris 3: Container Metrik Finansial & Tagihan (Card Rounded Abu-Abu persis InventoryModal) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/25 dark:bg-muted/10 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            {/* Biaya Tagihan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Biaya (IDR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono font-bold select-none pointer-events-none">
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
                  className="h-10 text-xs pl-9 font-mono font-bold rounded-xl bg-background border-border/80 shadow-xs"
                />
              </div>
            </div>

            {/* Siklus Penagihan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Siklus Penagihan</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(val) => setFormData({ ...formData, billing_cycle: val as BillingCycle })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/80 shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Bulanan (Monthly)</SelectItem>
                  <SelectItem value="Quarterly">Kuartalan (Quarterly)</SelectItem>
                  <SelectItem value="Semi-Annually">Semester (Semi-Annually)</SelectItem>
                  <SelectItem value="Yearly">Tahunan (Yearly)</SelectItem>
                  <SelectItem value="Custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tagihan Berikutnya */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Jatuh Tempo Berikutnya <span className="text-rose-500">*</span>
              </Label>
              <DatePicker
                value={formData.next_billing_date}
                onChange={(date) => setFormData({ ...formData, next_billing_date: date })}
                placeholder="Pilih tgl tagihan..."
                className="h-10 text-xs rounded-xl bg-background border-border/80 shadow-xs"
              />
            </div>
          </div>

          {/* Baris 4: Tgl Mulai & Catatan Tambahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Tgl Mulai Berlangganan
              </Label>
              <DatePicker
                value={formData.start_date || ""}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                placeholder="Pilih tgl mulai..."
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
                Catatan / Keterangan Lisensi
              </Label>
              <Input
                id="notes"
                placeholder="Masukkan Catatan"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Baris 5: Status Langganan - Radio Pills persis InventoryModal */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Status Langganan</Label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Aktif (Active) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Active" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Active"
                  ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Active"
                    ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                    : "bg-emerald-500/40"
                    }`}
                />
                <span>Aktif</span>
              </button>

              {/* Jatuh Tempo (Past Due) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Past Due" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Past Due"
                  ? "bg-rose-500/10 border-rose-500/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Past Due"
                    ? "bg-rose-500 ring-2 ring-rose-500/30"
                    : "bg-rose-500/40"
                    }`}
                />
                <span>Jatuh Tempo</span>
              </button>

              {/* Dibatalkan (Cancelled) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Cancelled" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Cancelled"
                  ? "bg-slate-500/10 border-slate-500/60 text-slate-700 dark:text-slate-300 ring-2 ring-slate-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Cancelled"
                    ? "bg-slate-500 ring-2 ring-slate-500/30"
                    : "bg-slate-500/40"
                    }`}
                />
                <span>Dibatalkan</span>
              </button>

              {/* Kedaluwarsa (Expired) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Expired" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Expired"
                  ? "bg-amber-500/10 border-amber-500/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Expired"
                    ? "bg-amber-500 ring-2 ring-amber-500/30"
                    : "bg-amber-500/40"
                    }`}
                />
                <span>Kedaluwarsa</span>
              </button>
            </div>
          </div>

          {/* Footer - Responsive and Touch-Friendly */}
          <DialogFooter className="pt-3 border-t border-border/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl text-xs font-medium border-border/80 w-full sm:w-auto justify-center"
            >
              Batal
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="h-9 px-3 sm:px-4 rounded-xl text-xs font-medium border-border/80 flex-1 sm:flex-none justify-center"
              >
                Simpan Draf
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 px-4 sm:px-5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 flex-1 sm:flex-none justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>{initialData ? "Simpan Perubahan" : "Tambah Langganan"}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
