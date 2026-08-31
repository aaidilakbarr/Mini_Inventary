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
import { formatNumberID } from "@/lib/formatters"
import type { SubscriptionItem, CreateSubscriptionPayload, Category, BillingCycle, SubscriptionStatus } from "@/types/database"

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
      setErrorMsg("Nama layanan harus diisi.")
      return
    }
    if (!formData.next_billing_date) {
      setErrorMsg("Tanggal jatuh tempo tagihan berikutnya harus diisi.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit(formData)
      onOpenChange(false)
    } catch (err: any) {
      console.error("Gagal menyimpan langganan:", err)
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {initialData ? "Ubah Informasi Langganan" : "Tambah Langganan Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {initialData
              ? "Perbarui detail paket langganan, biaya berulang, atau tanggal penagihan."
              : "Masukkan rincian layanan langganan atau lisensi software perusahaan."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Nama Layanan / Software *</Label>
              <Input
                placeholder="cth: Figma Professional, AWS Cloud, Zoom Enterprise"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Penyedia / Vendor</Label>
              <Input
                placeholder="cth: Figma Inc., Amazon Web Services"
                value={formData.provider || ""}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kategori</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : (val as string) })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="-- Pilih Kategori --" />
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Biaya (IDR)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none pointer-events-none">
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
                  className="h-8 text-xs pl-8 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Siklus Penagihan</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(val) => setFormData({ ...formData, billing_cycle: val as BillingCycle })}
              >
                <SelectTrigger className="h-8 text-xs">
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tgl Mulai Langganan</Label>
              <DatePicker
                value={formData.start_date || ""}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                placeholder="Pilih tgl mulai..."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tagihan Berikutnya *</Label>
              <DatePicker
                value={formData.next_billing_date}
                onChange={(date) => setFormData({ ...formData, next_billing_date: date })}
                placeholder="Pilih tgl tagihan..."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Metode Pembayaran</Label>
              <Input
                placeholder="cth: Kartu Kredit Corp, BCA Virtual Account"
                value={formData.payment_method || ""}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status Langganan</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as SubscriptionStatus })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Aktif (Active)</SelectItem>
                  <SelectItem value="Past Due">Jatuh Tempo (Past Due)</SelectItem>
                  <SelectItem value="Cancelled">Dibatalkan (Cancelled)</SelectItem>
                  <SelectItem value="Expired">Kedaluwarsa (Expired)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Catatan Tambahan</Label>
              <textarea
                rows={2}
                placeholder="Keterangan jumlah lisensi, akun PIC, login credential manager..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 text-xs rounded-md border border-input bg-background font-sans focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs gap-1"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Simpan Langganan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
