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
import { Label } from "@/components/ui/label"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Info, Layers } from "lucide-react"
import type { InventoryItem, CreateBorrowingPayload, BorrowingStatus } from "@/types/database"
import type { UserProfile } from "@/types/auth"

type BorrowType = "single" | "multiple"

interface BorrowingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableInventories: InventoryItem[]
  profiles: UserProfile[]
  currentUserId: string
  isAdmin: boolean
  onSubmit: (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => Promise<void>
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
  const [borrowType, setBorrowType] = useState<BorrowType>("single")
  const [singleInventoryId, setSingleInventoryId] = useState<string>("")
  const [multipleInventoryIds, setMultipleInventoryIds] = useState<[string, string, string]>(["", "", ""])
  
  const [borrowerId, setBorrowerId] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [status, setStatus] = useState<BorrowingStatus>(isAdmin ? "Borrowed" : "Pending Approval")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Default due date: 7 days from today
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const formattedDate = d.toISOString().split("T")[0]

    setBorrowType("single")
    setSingleInventoryId(availableInventories.length > 0 ? availableInventories[0].id : "")
    setMultipleInventoryIds([
      availableInventories.length > 0 ? availableInventories[0].id : "",
      availableInventories.length > 1 ? availableInventories[1].id : "",
      "",
    ])
    setBorrowerId(currentUserId || (profiles.length > 0 ? profiles[0].id : ""))
    setDueDate(formattedDate)
    setNotes("")
    setStatus(isAdmin ? "Borrowed" : "Pending Approval")
    setErrorMsg("")
  }, [open, availableInventories, profiles, currentUserId, isAdmin])

  const borrowTypeOptions: ComboboxOption[] = [
    { 
      value: "single", 
      label: "1 Barang", 
      sublabel: "Peminjaman 1 aset inventaris" 
    },
    { 
      value: "multiple", 
      label: "Lebih dari 1", 
      sublabel: "Peminjaman multi-aset (hingga 3 barang)" 
    },
  ]

  // Options for single mode
  const singleInventoryOptions: ComboboxOption[] = availableInventories.map((inv) => ({
    value: inv.id,
    label: inv.name,
    badge: inv.code,
    sublabel: `Stok: ${inv.quantity} unit (${inv.location || "Gudang"})`,
  }))

  // Generate dynamic options for multiple dropdown slot with remaining stock calculation
  const getMultipleOptionsForSlot = (slotIndex: number): ComboboxOption[] => {
    return availableInventories.map((inv) => {
      const selectedInOtherSlots = multipleInventoryIds.filter(
        (id, idx) => idx !== slotIndex && id === inv.id
      ).length
      const remainingStock = Math.max(0, (inv.quantity || 0) - selectedInOtherSlots)
      const isDisabled = remainingStock <= 0

      return {
        value: inv.id,
        label: inv.name,
        badge: inv.code,
        sublabel: isDisabled
          ? `Stok habis di slot lain (Total stok: ${inv.quantity})`
          : `Sisa Stok: ${remainingStock} unit (${inv.location || "Gudang"})`,
        disabled: isDisabled,
      }
    })
  }

  const handleMultipleSlotChange = (slotIndex: number, val: string) => {
    const updated: [string, string, string] = [...multipleInventoryIds]
    updated[slotIndex] = val
    setMultipleInventoryIds(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!borrowerId) {
      setErrorMsg("Peminjam harus ditentukan")
      return
    }
    if (!dueDate) {
      setErrorMsg("Tenggat waktu pengembalian wajib diisi")
      return
    }

    if (borrowType === "single") {
      if (!singleInventoryId) {
        setErrorMsg("Silakan pilih aset yang ingin dipinjam")
        return
      }

      try {
        setIsSubmitting(true)
        setErrorMsg("")
        await onSubmit({
          inventory_id: singleInventoryId,
          borrower_id: borrowerId,
          due_date: dueDate,
          notes: notes || null,
          status,
        })
        onOpenChange(false)
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal membuat permohonan peminjaman")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Multiple mode: slot 0 & slot 1 are required, slot 2 is optional
      if (!multipleInventoryIds[0] || !multipleInventoryIds[1]) {
        setErrorMsg("Silakan pilih minimal 2 barang (Pilihan Aset 1 dan Aset 2 wajib diisi)")
        return
      }

      const selectedIds = multipleInventoryIds.filter(Boolean)
      if (selectedIds.length < 2) {
        setErrorMsg("Silakan pilih minimal 2 barang pada opsi Lebih dari 1")
        return
      }

      // Validate stock availability
      for (const inv of availableInventories) {
        const count = selectedIds.filter((id) => id === inv.id).length
        if (count > (inv.quantity || 0)) {
          setErrorMsg(
            `Stok untuk aset "${inv.name}" tidak mencukupi untuk jumlah yang dipilih (${count} unit dipilih, stok tersedia: ${inv.quantity}).`
          )
          return
        }
      }

      const payloads: CreateBorrowingPayload[] = selectedIds.map((invId) => ({
        inventory_id: invId,
        borrower_id: borrowerId,
        due_date: dueDate,
        notes: notes || null,
        status,
      }))

      try {
        setIsSubmitting(true)
        setErrorMsg("")
        await onSubmit(payloads)
        onOpenChange(false)
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal membuat permohonan peminjaman")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const profileOptions: ComboboxOption[] = profiles.map((p) => ({
    value: p.id,
    label: p.full_name || p.email,
    sublabel: `${p.email} • ${p.role}`,
  }))

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

          {/* Combobox Pilihan Peminjaman */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Pilihan Peminjaman *</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {borrowType === "single" ? "1 Barang" : "Hingga 3 Barang"}
              </span>
            </div>
            <Combobox
              options={borrowTypeOptions}
              value={borrowType}
              onChange={(val) => {
                if (val === "single" || val === "multiple") {
                  setBorrowType(val)
                  setErrorMsg("")
                }
              }}
              placeholder="Pilih tipe peminjaman..."
              searchPlaceholder="Cari tipe peminjaman..."
            />
          </div>

          {/* Asset Selection Section */}
          {availableInventories.length === 0 ? (
            <div className="p-3 text-xs rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
              Tidak ada aset dengan status Tersedia saat ini. Tambah aset baru di menu Inventaris terlebih dahulu.
            </div>
          ) : borrowType === "single" ? (
            /* Single Asset Dropdown */
            <div className="space-y-1.5">
              <Label htmlFor="inventory" className="text-xs font-semibold">Pilih Aset Tersedia *</Label>
              <Combobox
                options={singleInventoryOptions}
                value={singleInventoryId}
                onChange={(val) => setSingleInventoryId(val)}
                placeholder="Pilih atau cari aset..."
                searchPlaceholder="Ketik nama atau kode aset..."
                emptyMessage="Aset tidak ditemukan."
              />
            </div>
          ) : (
            /* Multiple Assets Dropdowns (3 dropdowns) */
            <div className="space-y-3 p-3 rounded-xl border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Pilih Aset Tersedia (Multi-Barang)
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">Minimal 2 Aset</span>
              </div>

              {availableInventories.length < 3 && (
                <div className="p-2.5 text-[11px] leading-relaxed rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info className="size-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-semibold">Keterangan:</span> Tersedia {availableInventories.length} jenis aset di inventaris. Anda dapat memilih jenis aset yang sama jika stok unitnya mencukupi, atau mengosongkan aset ke-3.
                  </div>
                </div>
              )}

              {/* Slot 1 (Required) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">Aset 1 *</span>
                  <span className="text-[10px] text-muted-foreground">Wajib</span>
                </div>
                <Combobox
                  options={getMultipleOptionsForSlot(0)}
                  value={multipleInventoryIds[0]}
                  onChange={(val) => handleMultipleSlotChange(0, val)}
                  placeholder="Pilih aset pertama..."
                  searchPlaceholder="Ketik nama atau kode aset..."
                  emptyMessage="Aset tidak ditemukan."
                />
              </div>

              {/* Slot 2 (Required) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">Aset 2 *</span>
                  <span className="text-[10px] text-muted-foreground">Wajib</span>
                </div>
                <Combobox
                  options={getMultipleOptionsForSlot(1)}
                  value={multipleInventoryIds[1]}
                  onChange={(val) => handleMultipleSlotChange(1, val)}
                  placeholder="Pilih aset kedua..."
                  searchPlaceholder="Ketik nama atau kode aset..."
                  emptyMessage="Aset tidak ditemukan."
                />
              </div>

              {/* Slot 3 (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">Aset 3</span>
                  <span className="text-[10px] text-muted-foreground font-sans">Opsional</span>
                </div>
                <Combobox
                  options={getMultipleOptionsForSlot(2)}
                  value={multipleInventoryIds[2]}
                  onChange={(val) => handleMultipleSlotChange(2, val)}
                  placeholder="Pilih aset ketiga (opsional)..."
                  searchPlaceholder="Ketik nama atau kode aset..."
                  emptyMessage="Aset tidak ditemukan."
                  clearable={true}
                />
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="space-y-1.5">
              <Label htmlFor="borrower" className="text-xs font-semibold">Peminjam (Staff / Akun) *</Label>
              <Combobox
                options={profileOptions}
                value={borrowerId}
                onChange={(val) => setBorrowerId(val)}
                placeholder="Pilih peminjam..."
                searchPlaceholder="Cari nama atau email staff..."
                emptyMessage="Staff tidak ditemukan."
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="due_date" className="text-xs font-semibold">Tenggat Waktu Pengembalian *</Label>
            <DatePicker
              value={dueDate}
              onChange={(date) => setDueDate(date)}
              placeholder="Pilih tenggat pengembalian..."
            />
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Status Awal Peminjaman</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as BorrowingStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Borrowed">Langsung Dipinjam (Disetujui)</SelectItem>
                  <SelectItem value="Pending Approval">Menunggu Persetujuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">Keperluan / Catatan</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="misal: Presentasi sprint desain ke klien atau remote workstation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
