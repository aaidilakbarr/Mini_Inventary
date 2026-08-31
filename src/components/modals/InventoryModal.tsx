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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { InventoryItem, CreateInventoryPayload, Category, InventoryStatus } from "@/types/database"

interface InventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: InventoryItem | null
  categories: Category[]
  onSubmit: (payload: CreateInventoryPayload) => Promise<void>
}

export function InventoryModal({
  open,
  onOpenChange,
  initialData,
  categories,
  onSubmit,
}: InventoryModalProps) {
  const [formData, setFormData] = useState<CreateInventoryPayload>({
    code: "",
    name: "",
    category_id: "",
    quantity: 1,
    condition: "Bagus",
    location: "",
    supplier: "",
    warranty_info: "",
    status: "Available",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        category_id: initialData.category_id || "",
        quantity: initialData.quantity ?? 1,
        condition: initialData.condition || "Bagus",
        location: initialData.location || "",
        supplier: initialData.supplier || "",
        warranty_info: initialData.warranty_info || "",
        status: initialData.status || "Available",
        notes: initialData.notes || "",
      })
    } else {
      // Auto generate suggested asset code
      const rand = Math.floor(100 + Math.random() * 900)
      setFormData({
        code: `INV-${rand}`,
        name: "",
        category_id: "",
        quantity: 1,
        condition: "Bagus",
        location: "",
        supplier: "",
        warranty_info: "",
        status: "Available",
        notes: "",
      })
    }
    setErrorMsg("")
  }, [initialData, open, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg("Nama aset wajib diisi")
      return
    }
    if (!formData.code.trim()) {
      setErrorMsg("Kode aset unik wajib diisi")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit({
        ...formData,
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        quantity: Number(formData.quantity) || 1,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data aset")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Data Aset" : "Tambah Aset Baru"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Perbarui rincian informasi dan status aset inventaris."
              : "Masukkan data perangkat atau aset baru ke dalam basis data inventaris."}
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
              <Label htmlFor="code" className="text-xs font-semibold">Kode Aset *</Label>
              <Input
                id="code"
                placeholder="misal: INV-MAC-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">Kategori</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : (val as string) })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="-- Pilih Kategori --">
                    {formData.category_id && formData.category_id !== "none"
                      ? categories.find((c) => c.id === formData.category_id)?.name || "-- Pilih Kategori --"
                      : "-- Pilih Kategori --"}
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

          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Nama Barang / Model *</Label>
            <Input
              id="name"
              placeholder="misal: MacBook Pro 14 M3 Pro (18GB/512GB)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs font-semibold">Jumlah (Unit)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition" className="text-xs font-semibold">Kondisi</Label>
              <Select
                value={formData.condition || "Bagus"}
                onValueChange={(val) => setFormData({ ...formData, condition: val as string })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bagus">Bagus</SelectItem>
                  <SelectItem value="Cukup">Cukup</SelectItem>
                  <SelectItem value="Perlu Perbaikan">Perlu Perbaikan</SelectItem>
                  <SelectItem value="Rusak">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status Aset</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as InventoryStatus })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Tersedia (Available)</SelectItem>
                  <SelectItem value="Borrowed">Dipinjam (Borrowed)</SelectItem>
                  <SelectItem value="Maintenance">Perawatan (Maintenance)</SelectItem>
                  <SelectItem value="Lost">Hilang (Lost)</SelectItem>
                  <SelectItem value="Retired">Dinonaktifkan (Retired)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold">Lokasi Penyimpanan</Label>
              <Input
                id="location"
                placeholder="misal: Gudang IT - Rak A1"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="text-xs font-semibold">Pemasok / Vendor</Label>
              <Input
                id="supplier"
                placeholder="misal: Apple Store ID / iBox"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warranty" className="text-xs font-semibold">Masa Garansi / Catatan Garansi</Label>
            <Input
              id="warranty"
              placeholder="misal: 15 Feb 2027 atau Garansi Resmi 2 Tahun"
              value={formData.warranty_info || ""}
              onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">Catatan Tambahan</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Spesifikasi tambahan, kelengkapan aksesoris, dsb."
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
              <span>{initialData ? "Simpan Perubahan" : "Tambah Aset"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
