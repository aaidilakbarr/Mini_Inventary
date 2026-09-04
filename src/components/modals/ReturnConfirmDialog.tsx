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
import { 
  RotateCcw, 
  Loader2, 
  PackageCheck, 
  UserCheck, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  ShieldAlert,
  Info
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
    // If damaged, require return notes so technician / admin has context
    if (isDamaged && !notes.trim()) {
      setValidationError("Wajib mengisi catatan detail kerusakan agar teknisi mengetahui kendala aset.")
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Verifikasi & Konfirmasi Pengembalian
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                Periksa kondisi fisik barang secara teliti sebelum mengonfirmasi pengembalian ke sistem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Item Details Box */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <PackageCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-xs">
                    {item.inventory?.name || "Aset Inventaris"}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Kode: {item.inventory?.code || "-"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border/80 text-muted-foreground">
                Kondisi Awal: <strong className="text-foreground">{item.inventory?.condition || "Bagus"}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Peminjam:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {item.borrower?.full_name || "Tanpa Nama"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Batas Kembali:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatDateID(item.due_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Condition Selection Cards */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Kondisi Fisik Saat Pengembalian</span>
              <span className="text-[10px] font-normal text-muted-foreground">Pilih kondisi aktual</span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option: Bagus */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Bagus")
                  setValidationError(null)
                }}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  condition === "Bagus"
                    ? "border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500"
                    : "border-border/80 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${condition === "Bagus" ? "text-emerald-600" : "text-muted-foreground"}`} />
                    Bagus
                  </span>
                  <span className={`h-2 w-2 rounded-full ${condition === "Bagus" ? "bg-emerald-500" : "bg-transparent"}`} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Normal & utuh, siap dipinjamkan kembali.
                </p>
              </button>

              {/* Option: Rusak Ringan */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Rusak Ringan")
                  setValidationError(null)
                }}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  condition === "Rusak Ringan"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500"
                    : "border-border/80 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <AlertTriangle className={`h-3.5 w-3.5 ${condition === "Rusak Ringan" ? "text-amber-600" : "text-muted-foreground"}`} />
                    Rusak Ringan
                  </span>
                  <span className={`h-2 w-2 rounded-full ${condition === "Rusak Ringan" ? "bg-amber-500" : "bg-transparent"}`} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Cacat fungsi minor/lecet, perlu perbaikan.
                </p>
              </button>

              {/* Option: Rusak Berat */}
              <button
                type="button"
                onClick={() => {
                  setCondition("Rusak Berat")
                  setValidationError(null)
                }}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  condition === "Rusak Berat"
                    ? "border-rose-500 bg-rose-500/10 shadow-xs ring-1 ring-rose-500"
                    : "border-border/80 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <AlertOctagon className={`h-3.5 w-3.5 ${condition === "Rusak Berat" ? "text-rose-600" : "text-muted-foreground"}`} />
                    Rusak Berat
                  </span>
                  <span className={`h-2 w-2 rounded-full ${condition === "Rusak Berat" ? "bg-rose-500" : "bg-transparent"}`} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Mati total / parah, tidak dapat dipinjam.
                </p>
              </button>
            </div>
          </div>

          {/* Dynamic Protection / Action Banner */}
          {condition === "Bagus" && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Aset Tersedia untuk Dipinjam</p>
                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  Stok inventaris bertambah 1 unit dan status aset diset ke <strong>Available (Tersedia)</strong> sehingga dapat segera dipinjam oleh staf lain.
                </p>
              </div>
            </div>
          )}

          {condition === "Rusak Ringan" && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Wrench className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Proteksi Stok: Masuk Masa Perawatan</p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Status aset otomatis diubah menjadi <strong>Maintenance (Perawatan)</strong> dan <strong>TIDAK</strong> masuk ke stok Tersedia agar terlindungi dari peminjaman baru sampai selesai diservis.
                </p>
              </div>
            </div>
          )}

          {condition === "Rusak Berat" && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Peringatan: Aset Rusak Parah</p>
                <p className="text-[11px] text-rose-700/90 dark:text-rose-400 mt-0.5 leading-relaxed">
                  Status aset diset ke <strong>Maintenance</strong> dan dinonaktifkan dari daftar peminjaman. Wajib dicatat kendala spesifik untuk proses penanganan lebih lanjut.
                </p>
              </div>
            </div>
          )}

          {/* Return Notes Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="return-notes" className="text-xs font-semibold text-foreground">
                Catatan Pengembalian {isDamaged ? <span className="text-destructive">* (Wajib diisi)</span> : <span className="text-muted-foreground font-normal">(Opsional)</span>}
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {isDamaged ? "Jelaskan kerusakan fisik aset" : "Aksesoris, kondisi, dll."}
              </span>
            </div>
            <textarea
              id="return-notes"
              rows={3}
              placeholder={
                isDamaged
                  ? "Tuliskan rincian kerusakan (misal: Layar retak di pojok kanan, tombol power macet, casing penyok, dsb.)..."
                  : "Tambahkan catatan jika ada (misal: Aksesoris charger dan tas lengkap, baterai terisi penuh)..."
              }
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (validationError) setValidationError(null)
              }}
              className={`w-full text-xs rounded-lg border bg-background p-2.5 text-foreground outline-none transition-colors focus:border-ring ${
                validationError ? "border-destructive focus:border-destructive" : "border-input"
              }`}
            />
            {validationError && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 inline" />
                {validationError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-3 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs h-8"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSubmit}
            disabled={isLoading}
            className={`gap-1.5 text-xs h-8 text-white ${
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
              {condition === "Bagus" ? "Kembalikan (Tersedia)" : "Kembalikan (Perlu Servis)"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
