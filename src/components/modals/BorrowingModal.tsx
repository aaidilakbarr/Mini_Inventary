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
import { Input } from "@/components/ui/input"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Info,
  Layers,
  Package,
  ArrowLeftRight,
  Plus
} from "lucide-react"
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
  initialInventoryId?: string
  onSubmit: (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => Promise<void>
}

export function BorrowingModal({
  open,
  onOpenChange,
  availableInventories,
  profiles,
  currentUserId,
  isAdmin,
  initialInventoryId,
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
    if (!open) return

    // Default due date: 7 days from today
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const formattedDate = d.toISOString().split("T")[0]

    setBorrowType("single")
    const targetId = (initialInventoryId && availableInventories.some(inv => inv.id === initialInventoryId))
      ? initialInventoryId
      : (availableInventories.length > 0 ? availableInventories[0].id : "")

    setSingleInventoryId(targetId)
    setMultipleInventoryIds([
      targetId,
      availableInventories.length > 1 ? (availableInventories.find(inv => inv.id !== targetId)?.id || "") : "",
      "",
    ])
    setBorrowerId(currentUserId || (profiles.length > 0 ? profiles[0].id : ""))
    setDueDate(formattedDate)
    setNotes("")
    setStatus(isAdmin ? "Borrowed" : "Pending Approval")
    setErrorMsg("")
  }, [open, availableInventories, profiles, currentUserId, isAdmin, initialInventoryId])

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
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl">
        {/* Header - Layout persis modal form Tambah Aset */}
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Permohonan Peminjaman Aset
                  </DialogTitle>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                    Peminjaman Baru
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Ajukan peminjaman aset inventaris kantor dengan menentukan kuantitas barang dan tenggat pengembalian.
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

          {/* Baris 1: Komponen Tabs Slider untuk Pemilihan Pinjaman */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pilihan Peminjaman <span className="text-rose-500">*</span></span>
              </Label>
            </div>

            {/* Shadcn Tabs Slider */}
            <Tabs
              value={borrowType}
              onValueChange={(val: any) => {
                if (val === "single" || val === "multiple") {
                  setBorrowType(val)
                  setErrorMsg("")
                }
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-11 p-1 bg-slate-100 dark:bg-muted/60 rounded-xl border border-slate-200 dark:border-border/70 items-center">
                <TabsTrigger
                  value="single"
                  className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${borrowType === "single"
                    ? "bg-white dark:bg-card text-blue-700 dark:text-blue-300 shadow-xs font-bold border border-slate-200/90 dark:border-border"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Package className={`h-3.5 w-3.5 shrink-0 transition-colors ${borrowType === "single" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                  <span>1 Barang</span>
                </TabsTrigger>
                <TabsTrigger
                  value="multiple"
                  className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${borrowType === "multiple"
                    ? "bg-white dark:bg-card text-blue-700 dark:text-blue-300 shadow-xs font-bold border border-slate-200/90 dark:border-border"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Layers className={`h-3.5 w-3.5 shrink-0 transition-colors ${borrowType === "multiple" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                  <span>Multi Aset</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Baris 2: Pemilihan Aset (Single vs Multi-Aset Card Container) */}
          {availableInventories.length === 0 ? (
            <div className="p-3.5 text-xs rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
              Tidak ada aset dengan status Tersedia saat ini. Tambah aset baru di menu Inventaris terlebih dahulu.
            </div>
          ) : borrowType === "single" ? (
            /* Single Asset Selection */
            <div className="space-y-1.5">
              <Label htmlFor="inventory" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Pilih Aset Tersedia <span className="text-rose-500">*</span>
              </Label>
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
            /* Multi-Aset Container Card - Stacked Atas ke Bawah */
            <div className="p-3.5 sm:p-4 rounded-xl bg-muted/25 dark:bg-muted/10 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Daftar Aset Yang Dipinjam (Multi-Barang)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pilih minimal 2 aset yang ingin dipinjam sekaligus dalam satu permohonan.
                  </p>
                </div>
              </div>

              {availableInventories.length < 3 && (
                <div className="p-2.5 text-[11px] leading-relaxed rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-semibold">Keterangan:</span> Tersedia {availableInventories.length} jenis aset di inventaris. Anda dapat memilih jenis aset yang sama jika stok unitnya mencukupi, atau mengosongkan aset ke-3.
                  </div>
                </div>
              )}

              {/* Stacked Vertical Slots (Atas ke Bawah) */}
              <div className="space-y-2.5">
                {/* Slot 1 (Required) */}
                <div className="p-3 rounded-xl bg-card/90 dark:bg-card border border-border/70 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        1
                      </span>
                      <span className="text-xs font-semibold text-foreground">Aset Pertama</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Wajib Dipilih
                    </span>
                  </div>
                  <Combobox
                    options={getMultipleOptionsForSlot(0)}
                    value={multipleInventoryIds[0]}
                    onChange={(val) => handleMultipleSlotChange(0, val)}
                    placeholder="Pilih atau cari aset pertama..."
                    searchPlaceholder="Ketik nama atau kode aset..."
                    emptyMessage="Aset tidak ditemukan."
                  />
                </div>

                {/* Slot 2 (Required) */}
                <div className="p-3 rounded-xl bg-card/90 dark:bg-card border border-border/70 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        2
                      </span>
                      <span className="text-xs font-semibold text-foreground">Aset Kedua</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Wajib Dipilih
                    </span>
                  </div>
                  <Combobox
                    options={getMultipleOptionsForSlot(1)}
                    value={multipleInventoryIds[1]}
                    onChange={(val) => handleMultipleSlotChange(1, val)}
                    placeholder="Pilih atau cari aset kedua..."
                    searchPlaceholder="Ketik nama atau kode aset..."
                    emptyMessage="Aset tidak ditemukan."
                  />
                </div>

                {/* Slot 3 (Optional) */}
                <div className="p-3 rounded-xl bg-card/90 dark:bg-card border border-border/70 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 dark:bg-muted text-muted-foreground text-[10px] font-bold">
                        3
                      </span>
                      <span className="text-xs font-semibold text-foreground">Aset Ketiga</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {multipleInventoryIds[2] && (
                        <button
                          type="button"
                          onClick={() => handleMultipleSlotChange(2, "")}
                          className="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium hover:underline cursor-pointer"
                        >
                          Hapus Pilihan
                        </button>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/70">
                        Opsional
                      </span>
                    </div>
                  </div>
                  <Combobox
                    options={getMultipleOptionsForSlot(2)}
                    value={multipleInventoryIds[2]}
                    onChange={(val) => handleMultipleSlotChange(2, val)}
                    placeholder="Pilih atau cari aset ketiga (opsional)..."
                    searchPlaceholder="Ketik nama atau kode aset..."
                    emptyMessage="Aset tidak ditemukan."
                    clearable={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Baris 3: Peminjam & Tenggat Waktu Pengembalian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="borrower" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Peminjam (Staff / Akun) <span className="text-rose-500">*</span>
                </Label>
                <Combobox
                  options={profileOptions}
                  value={borrowerId}
                  onChange={(val) => setBorrowerId(val)}
                  placeholder="Pilih peminjam..."
                  searchPlaceholder="Cari nama atau email staff..."
                  emptyMessage="Staff tidak ditemukan."
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Peminjam Terdaftar</Label>
                <div className="h-10 px-3 rounded-xl bg-muted/30 border border-border/80 flex items-center text-xs font-medium text-foreground">
                  {profiles.find(p => p.id === borrowerId)?.full_name || "Akun Saya"}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Tenggat Waktu Pengembalian <span className="text-rose-500">*</span>
              </Label>
              <DatePicker
                value={dueDate}
                onChange={(date) => setDueDate(date)}
                placeholder="Pilih tenggat pengembalian..."
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>
          </div>

          {/* Baris 4: Status Awal Peminjaman (Radio Pills persis InventoryModal) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Status Awal Peminjaman</Label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Langsung Dipinjam (Borrowed) */}
                <button
                  type="button"
                  onClick={() => setStatus("Borrowed")}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${status === "Borrowed"
                    ? "bg-blue-500/10 border-blue-500/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold"
                    : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-all ${status === "Borrowed"
                      ? "bg-blue-500 ring-2 ring-blue-500/30"
                      : "bg-blue-500/40"
                      }`}
                  />
                  <span>Langsung Dipinjam (Disetujui)</span>
                </button>

                {/* Menunggu Persetujuan (Pending Approval) */}
                <button
                  type="button"
                  onClick={() => setStatus("Pending Approval")}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${status === "Pending Approval"
                    ? "bg-amber-500/10 border-amber-500/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 font-semibold"
                    : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-all ${status === "Pending Approval"
                      ? "bg-amber-500 ring-2 ring-amber-500/30"
                      : "bg-amber-500/40"
                      }`}
                  />
                  <span>Menunggu Persetujuan</span>
                </button>
              </div>
            </div>
          )}

          {/* Baris 5: Keperluan / Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Keperluan / Catatan
            </Label>
            <Input
              id="notes"
              placeholder="Masukkan keperluan / catatan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
            />
          </div>

          {/* Footer - Persis modal form Tambah Aset */}
          <DialogFooter className="pt-3 border-t border-border/50 flex flex-row items-center justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl text-xs font-medium border-border/80 flex-1 sm:flex-none justify-center"
            >
              Batal
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || availableInventories.length === 0}
              className="h-9 px-5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 flex-1 sm:flex-none justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{isAdmin ? "Catat Peminjaman" : "Kirim Permohonan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
