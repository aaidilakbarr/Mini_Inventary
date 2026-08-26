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
import type {
  SubscriptionItem,
  CreateSubscriptionPayload,
  Category,
  BillingCycle,
  SubscriptionStatus
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
        cost: initialData.cost ?? 0,
        billing_cycle: initialData.billing_cycle || "Monthly",
        next_billing_date: initialData.next_billing_date ? initialData.next_billing_date.split("T")[0] : "",
        payment_method: initialData.payment_method || "",
        status: initialData.status || "Active",
        notes: initialData.notes || "",
      })
    } else {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      const formattedDate = d.toISOString().split("T")[0]

      setFormData({
        service_name: "",
        provider: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        cost: 0,
        billing_cycle: "Monthly",
        next_billing_date: formattedDate,
        payment_method: "Visa Korporat",
        status: "Active",
        notes: "",
      })
    }
    setErrorMsg("")
  }, [initialData, open, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service_name.trim()) {
      setErrorMsg("Nama layanan langganan wajib diisi")
      return
    }
    if (!formData.next_billing_date) {
      setErrorMsg("Tanggal tagihan berikutnya wajib diisi")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit({
        ...formData,
        category_id: formData.category_id ? formData.category_id : null,
        cost: Number(formData.cost) || 0,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data langganan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Data Langganan" : "Tambah Langganan Baru"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Perbarui detail biaya, tanggal tagihan, atau penyedia layanan SaaS."
              : "Tambahkan lisensi software, layanan cloud, atau tagihan berulang."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="service_name" className="text-xs font-semibold">Nama Layanan *</Label>
              <Input
                id="service_name"
                placeholder="misal: AWS Cloud Infrastructure"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-xs font-semibold">Penyedia / Vendor</Label>
              <Input
                id="provider"
                placeholder="misal: Amazon Web Services"
                value={formData.provider || ""}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">Kategori</Label>
              <select
                id="category"
                value={formData.category_id || ""}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status Langganan</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="Active">Aktif (Active)</option>
                <option value="Cancelled">Dibatalkan (Cancelled)</option>
                <option value="Expired">Kadaluarsa (Expired)</option>
                <option value="Past Due">Menunggak (Past Due)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="cost" className="text-xs font-semibold">Biaya ($ / USD)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="billing_cycle" className="text-xs font-semibold">Siklus Tagihan</Label>
              <select
                id="billing_cycle"
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="Monthly">Bulanan (Monthly)</option>
                <option value="Quarterly">Kuartal (Quarterly)</option>
                <option value="Semi-Annually">Semesteran (Semi-Annually)</option>
                <option value="Yearly">Tahunan (Yearly)</option>
                <option value="Custom">Kustom (Custom)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="next_billing_date" className="text-xs font-semibold">Tgl Tagihan Berikutnya *</Label>
              <Input
                id="next_billing_date"
                type="date"
                value={formData.next_billing_date}
                onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_method" className="text-xs font-semibold">Metode Pembayaran</Label>
              <Input
                id="payment_method"
                placeholder="misal: Visa Korporat (..4242)"
                value={formData.payment_method || ""}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">Catatan</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Jumlah lisensi, info akun admin, dsb."
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-input bg-background p-2 text-foreground outline-none focus:border-ring"
            />
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
              <span>{initialData ? "Simpan Perubahan" : "Tambah Langganan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
