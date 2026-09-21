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
import { Badge } from "@/components/ui/badge"
import { 
  RotateCcw, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Wrench,
  Camera
} from "lucide-react"
import { formatDateID } from "@/lib/formatters"
import type { BorrowingItem } from "@/types/database"

export type ReturnConditionType = "Bagus" | "Rusak Ringan" | "Rusak Berat"

export interface ReturnConfirmPayload {
  condition: ReturnConditionType
  notes: string
}

interface ReturnConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BorrowingItem | null
  onConfirm: (payload: ReturnConfirmPayload) => Promise<void> | void
  isLoading?: boolean
}

export function ReturnConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isLoading = false,
}: ReturnConfirmDialogProps) {
  const [condition, setCondition] = useState<ReturnConditionType>("Bagus")
  const [notes, setNotes] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Reset state on open or item change
  useEffect(() => {
    if (open) {
      setCondition("Bagus")
      setNotes("")
      setValidationError(null)
    }
  }, [open, item])

  if (!item) return null

  const isDamaged = condition === "Rusak Ringan" || condition === "Rusak Berat"

  const handleConfirmSubmit = () => {
    if (isDamaged && !notes.trim()) {
      setValidationError("Wajib mengisi rincian kendala/kerusakan pada catatan.")
      return
    }

    setValidationError(null)
    onConfirm({
      condition,
      notes: notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-lg font-bold text-foreground">
                Verifikasi & Pengembalian
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs mt-0.5 text-muted-foreground">
                Periksa kondisi aktual aset sebelum menyelesaikan transaksi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 text-xs">
          {/* Item & Borrower Summary Card */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                  Aset Inventaris
                </span>
                <p className="font-bold text-foreground text-xs sm:text-sm leading-snug truncate">
                  {item.inventory?.name || "Aset Inventaris"}
                </p>
                <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                  Kode: <strong className="text-foreground">{item.inventory?.code || "-"}</strong>
                </p>
              </div>
              <Badge variant="outline" className="bg-background text-[10px] font-mono shrink-0">
                Kondisi: {item.inventory?.condition || "Baik"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
              <div>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Peminjam</span>
                <span className="font-medium text-foreground truncate block">
                  {item.borrower?.full_name || "Tanpa Nama"}
                </span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Batas Waktu</span>
                <span className="font-mono font-medium text-foreground block">
                  {formatDateID(item.due_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Condition Selector (Mobile: Thumb-Friendly List / Desktop: 3-Col Cards) */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Kondisi Fisik Pengembalian <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Pilih kondisi aktual</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option: Bagus */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Bagus")
                  setValidationError(null)
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center sm:items-start justify-between sm:flex-col sm:justify-between min-h-[44px] ${
                  condition === "Bagus"
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-xs"
                    : "border-border/70 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between sm:mb-1">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${condition === "Bagus" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div className="sm:hidden">
                    <span className="font-bold text-xs text-foreground block">Bagus</span>
                    <span className="text-[10px] text-muted-foreground block">Normal & utuh</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${condition === "Bagus" ? "bg-emerald-500" : "bg-transparent"}`} />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-xs text-foreground block">Bagus</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">Normal & utuh</span>
                </div>
              </button>

              {/* Option: Rusak Ringan */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Rusak Ringan")
                  setValidationError(null)
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center sm:items-start justify-between sm:flex-col sm:justify-between min-h-[44px] ${
                  condition === "Rusak Ringan"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500 shadow-xs"
                    : "border-border/70 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between sm:mb-1">
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${condition === "Rusak Ringan" ? "text-amber-600" : "text-muted-foreground"}`} />
                  <div className="sm:hidden">
                    <span className="font-bold text-xs text-foreground block">Rusak Ringan</span>
                    <span className="text-[10px] text-muted-foreground block">Cacat minor/servis</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${condition === "Rusak Ringan" ? "bg-amber-500" : "bg-transparent"}`} />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-xs text-foreground block">Rusak Ringan</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">Cacat minor/servis</span>
                </div>
              </button>

              {/* Option: Rusak Berat */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Rusak Berat")
                  setValidationError(null)
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center sm:items-start justify-between sm:flex-col sm:justify-between min-h-[44px] ${
                  condition === "Rusak Berat"
                    ? "border-rose-500 bg-rose-500/10 ring-1 ring-rose-500 shadow-xs"
                    : "border-border/70 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between sm:mb-1">
                  <AlertOctagon className={`h-4 w-4 shrink-0 ${condition === "Rusak Berat" ? "text-rose-600" : "text-muted-foreground"}`} />
                  <div className="sm:hidden">
                    <span className="font-bold text-xs text-foreground block">Rusak Berat</span>
                    <span className="text-[10px] text-muted-foreground block">Mati total/parah</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${condition === "Rusak Berat" ? "bg-rose-500" : "bg-transparent"}`} />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-xs text-foreground block">Rusak Berat</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">Mati total / parah</span>
                </div>
              </button>
            </div>
          </div>

          {/* Compact Impact Pill */}
          <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-[10px] sm:text-[11px] ${
            condition === "Bagus"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : condition === "Rusak Ringan"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}>
            {condition === "Bagus" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Aset langsung dialihkan ke status <strong>Tersedia</strong> untuk dipinjam kembali.</span>
              </>
            ) : condition === "Rusak Ringan" ? (
              <>
                <Wrench className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Aset otomatis dibuatkan tiket <strong>Perawatan (Maintenance)</strong>.</span>
              </>
            ) : (
              <>
                <AlertOctagon className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Aset dinonaktifkan & dibuatkan tiket servis prioritas <strong>Tinggi</strong>.</span>
              </>
            )}
          </div>

          {/* Return Notes Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="return-notes" className="text-xs font-semibold text-foreground">
                Catatan Verifikasi {isDamaged ? <span className="text-destructive">* (Wajib)</span> : <span className="text-muted-foreground font-normal">(Opsional)</span>}
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {isDamaged ? "Rincian kerusakan" : "Kelengkapan, dll."}
              </span>
            </div>
            <textarea
              id="return-notes"
              rows={3}
              placeholder={
                isDamaged
                  ? "Tulis rincian kendala/kerusakan (misal: Layar retak, port charger longgar)..."
                  : "Catatan kelengkapan aset (misal: Unit dan aksesoris kembali lengkap)..."
              }
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (validationError) setValidationError(null)
              }}
              className={`w-full text-xs rounded-xl border bg-background p-2.5 text-foreground outline-none transition-colors focus:border-ring ${
                validationError ? "border-destructive focus:border-destructive" : "border-input"
              }`}
            />
            {validationError && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3 inline" />
                {validationError}
              </p>
            )}
          </div>

          {/* Foto Pengembalian (Future-Ready Slot) */}
          <div className="p-3 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                Dokumentasi Foto Pengembalian
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Segera Hadir</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Slot foto kondisi fisik saat barang diterima kembali.
            </p>
          </div>
        </div>

        {/* Footer (Responsive Mobile-First) */}
        <DialogFooter className="mt-2 border-t border-border/60 pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs h-9 sm:h-8 px-3.5 border-border/80 w-full sm:w-auto rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSubmit}
            disabled={isLoading}
            className={`gap-1.5 text-xs h-9 sm:h-8 px-4 text-white font-semibold transition-all w-full sm:w-auto rounded-xl ${
              isDamaged 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span>
              {condition === "Bagus" ? "Selesaikan Pengembalian" : "Simpan & Jadwalkan Servis"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

