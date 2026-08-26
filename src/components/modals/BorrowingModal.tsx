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
import type { InventoryItem, CreateBorrowingPayload, BorrowingStatus } from "@/types/database"
import type { UserProfile } from "@/types/auth"

interface BorrowingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableInventories: InventoryItem[]
  profiles: UserProfile[]
  currentUserId: string
  isAdmin: boolean
  onSubmit: (payload: CreateBorrowingPayload) => Promise<void>
}

export function BorrowingModal({
  open,
  onOpenChange,
  availableInventories,
  profiles,
  currentUserId,
  isAdmin,
  onSubmit,
}: BorrowingModalProps) {
  const [formData, setFormData] = useState<CreateBorrowingPayload>({
    inventory_id: "",
    borrower_id: currentUserId,
    due_date: "",
    notes: "",
    status: isAdmin ? "Borrowed" : "Pending Approval",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Default due date: 7 days from today
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const formattedDate = d.toISOString().split("T")[0]

    setFormData({
      inventory_id: availableInventories.length > 0 ? availableInventories[0].id : "",
      borrower_id: currentUserId || (profiles.length > 0 ? profiles[0].id : ""),
      due_date: formattedDate,
      notes: "",
      status: isAdmin ? "Borrowed" : "Pending Approval",
    })
    setErrorMsg("")
  }, [open, availableInventories, profiles, currentUserId, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.inventory_id) {
      setErrorMsg("Silakan pilih aset yang ingin dipinjam")
      return
    }
    if (!formData.borrower_id) {
      setErrorMsg("Peminjam harus ditentukan")
      return
    }
    if (!formData.due_date) {
      setErrorMsg("Tenggat waktu pengembalian wajib diisi")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")
      await onSubmit(formData)
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat permohonan peminjaman")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permohonan Peminjaman Aset</DialogTitle>
          <DialogDescription>
            Ajukan peminjaman aset inventaris kantor dengan menentukan aset dan tenggat waktu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inventory" className="text-xs font-semibold">Pilih Aset Tersedia *</Label>
            {availableInventories.length === 0 ? (
              <div className="p-3 text-xs rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                Tidak ada aset dengan status Tersedia saat ini. Tambah aset baru di menu Inventaris terlebih dahulu.
              </div>
            ) : (
              <select
                id="inventory"
                value={formData.inventory_id}
                onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
                required
              >
                {availableInventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    [{inv.code}] {inv.name} ({inv.location || 'Gudang'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {isAdmin ? (
            <div className="space-y-1.5">
              <Label htmlFor="borrower" className="text-xs font-semibold">Peminjam (Staff / Akun) *</Label>
              <select
                id="borrower"
                value={formData.borrower_id}
                onChange={(e) => setFormData({ ...formData, borrower_id: e.target.value })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
                required
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.email}) - {p.role}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="due_date" className="text-xs font-semibold">Tenggat Waktu Pengembalian *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="h-8 text-xs font-mono"
              required
            />
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status Awal Peminjaman</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BorrowingStatus })}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-2.5 text-foreground outline-none focus:border-ring"
              >
                <option value="Borrowed">Langsung Dipinjam (Disetujui)</option>
                <option value="Pending Approval">Menunggu Persetujuan</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">Keperluan / Catatan</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="misal: Presentasi sprint desain ke klien atau remote workstation"
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
              disabled={isSubmitting || availableInventories.length === 0}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isAdmin ? "Catat Peminjaman" : "Kirim Permohonan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
