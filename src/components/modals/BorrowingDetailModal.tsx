import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateID } from "@/lib/formatters"
import { 
  FileText, 
  PackageCheck, 
  UserCheck, 
  RotateCcw, 
  CheckCircle2, 
  Printer, 
  Clock, 
  Wrench,
  ShieldCheck,
  Building2
} from "lucide-react"
import type { BorrowingItem } from "@/types/database"

interface BorrowingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: BorrowingItem | null
}

export function BorrowingDetailModal({ isOpen, onClose, item }: BorrowingDetailModalProps) {
  if (!item) return null

  // Extract initial and return notes / conditions
  const parseNotes = () => {
    let initialNotes: string | null = null
    let returnCondition = item.return_condition || null
    let returnNotes = item.return_notes || null

    if (item.notes) {
      const match = item.notes.match(/\[Pengembalian - Kondisi:\s*([^\]|]+)\](?:\s*Catatan:\s*([^\n]+))?/)
      if (match) {
        if (!returnCondition) returnCondition = match[1]?.trim() || null
        if (!returnNotes && match[2]) returnNotes = match[2]?.trim() || null
        initialNotes = item.notes.replace(/\[Pengembalian - Kondisi:[^\]]+\](?:\s*Catatan:[^\n]+)?/g, '').trim() || null
      } else {
        initialNotes = item.notes.trim()
      }
    }

    return {
      initialNotes,
      returnCondition: returnCondition || (item.status === "Returned" ? "Bagus" : null),
      returnNotes,
    }
  }

  const { initialNotes, returnCondition, returnNotes } = parseNotes()
  const isReturned = item.status === "Returned"
  const isPending = item.status === "Pending Approval"
  const isBorrowed = item.status === "Borrowed"

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Formulir Peminjaman & Verifikasi Pengembalian
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Bukti riwayat serah terima, kondisi awal, dan verifikasi fisik saat pengembalian.
                </DialogDescription>
              </div>
            </div>

            <Badge 
              variant={
                isReturned ? "outline" :
                isBorrowed ? "default" :
                isPending ? "secondary" : "destructive"
              }
              className="text-[11px] font-mono font-semibold px-2.5 py-1 shrink-0"
            >
              {isReturned ? "Sudah Dikembalikan" :
               isBorrowed ? "Sedang Dipinjam" :
               isPending ? "Menunggu Persetujuan" : "Ditolak"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Section 1: Item & Borrower Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/70">
            {/* Asset Info */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <PackageCheck className="h-3.5 w-3.5 text-primary" />
                Informasi Aset
              </span>
              <p className="text-sm font-bold text-foreground leading-tight">
                {item.inventory?.name || "Aset Inventaris"}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span>Kode: <strong className="text-foreground">{item.inventory?.code || "-"}</strong></span>
                <span>•</span>
                <span>Kategori: {item.inventory?.category?.name || "Umum"}</span>
              </div>
              {item.inventory?.location && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  Lokasi: {item.inventory.location}
                </p>
              )}
            </div>

            {/* Borrower Info */}
            <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-3">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Identitas Peminjam
              </span>
              <p className="text-sm font-bold text-foreground leading-tight">
                {item.borrower?.full_name || "Tanpa Nama"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Email: <span className="font-mono text-foreground">{item.borrower?.email || "-"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Role: <span className="capitalize font-medium text-foreground">{item.borrower?.role || "Staf"}</span>
              </p>
            </div>
          </div>

          {/* Timeline & Schedule Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-lg border border-border/60 bg-background">
            <div>
              <span className="text-muted-foreground block text-[10px]">Tgl Pengajuan</span>
              <span className="font-mono font-medium text-foreground">{formatDateID(item.request_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Tgl Mulai</span>
              <span className="font-mono font-medium text-foreground">
                {item.start_date ? formatDateID(item.start_date) : "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Batas Waktu (Tenggat)</span>
              <span className="font-mono font-medium text-foreground">{formatDateID(item.due_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Tgl Pengembalian</span>
              <span className="font-mono font-semibold text-primary">
                {item.return_date ? formatDateID(item.return_date) : "Belum Kembali"}
              </span>
            </div>
          </div>

          {/* Section 2: DUAL CARD COMPARISON (Kondisi Awal vs Kondisi Pengembalian) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card A: Kondisi Di Awal Peminjaman */}
            <div className="rounded-lg border border-border/80 bg-background p-3.5 space-y-2.5 relative">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Kondisi Di Awal Peminjaman
                </span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                  Bagus / Normal
                </Badge>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Status Fisik Awal:</span>
                  <p className="font-medium text-foreground">
                    Barang diserahkan dalam kondisi baik, berfungsi normal, dan siap digunakan.
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px]">Keperluan / Catatan Peminjaman:</span>
                  <div className="p-2 rounded bg-muted/40 border border-border/40 text-foreground font-mono text-[11px] min-h-[44px]">
                    {initialNotes || "Tidak ada catatan keperluan khusus dicantumkan saat pengajuan."}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40">
                  <span>Status Stok Awal:</span>
                  <span className="font-medium text-foreground">Tersedia → Dialokasikan</span>
                </div>
              </div>
            </div>

            {/* Card B: Kondisi Saat Barang Dikembalikan */}
            <div className={`rounded-lg border p-3.5 space-y-2.5 relative ${
              !isReturned
                ? "border-dashed border-border/80 bg-muted/20"
                : returnCondition === "Bagus"
                ? "border-emerald-500/40 bg-emerald-500/5"
                : returnCondition === "Rusak Ringan"
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-rose-500/40 bg-rose-500/5"
            }`}>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <RotateCcw className={`h-4 w-4 ${
                    !isReturned ? "text-muted-foreground" :
                    returnCondition === "Bagus" ? "text-emerald-600" :
                    returnCondition === "Rusak Ringan" ? "text-amber-600" : "text-rose-600"
                  }`} />
                  Kondisi Saat Barang Dikembalikan
                </span>

                {isReturned ? (
                  <Badge 
                    variant="outline"
                    className={`text-[10px] font-mono font-bold ${
                      returnCondition === "Bagus"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : returnCondition === "Rusak Ringan"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {returnCondition === "Bagus" ? "✓ Fisik: Bagus" :
                     returnCondition === "Rusak Ringan" ? "⚠ Rusak Ringan" : "✕ Rusak Berat"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Belum Kembali
                  </Badge>
                )}
              </div>

              {isReturned ? (
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Status Inventaris Pasca-Kembali:</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      {returnCondition === "Bagus" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-400">Available (Tersedia untuk dipinjam kembali)</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-700 dark:text-amber-400">Maintenance (Masuk masa perawatan teknis)</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Catatan Verifikasi Pengembalian:</span>
                    <div className="p-2 rounded bg-background border border-border/60 text-foreground font-mono text-[11px] min-h-[44px]">
                      {returnNotes || (returnCondition === "Bagus" ? "Aset kembali lengkap dan berfungsi dengan baik tanpa kendala." : "Tidak ada catatan detail tambahan.")}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40">
                    <span>Diverifikasi Tanggal:</span>
                    <span className="font-mono font-medium text-foreground">
                      {item.return_date ? formatDateID(item.return_date) : "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[11px] py-2 text-muted-foreground">
                  <div className="flex items-start gap-2 p-2.5 rounded bg-muted/40 border border-border/40">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-xs">Pemeriksaan Belum Dilakukan</p>
                      <p className="text-[10px] mt-0.5 leading-relaxed">
                        Aset saat ini masih berada di bawah tanggung jawab peminjam. Verifikasi kondisi fisik dan pencatatan catatan pengembalian akan diisi saat proses pengembalian dilakukan.
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] italic">
                    * Bila aset dikembalikan dalam keadaan rusak ringan/berat, sistem akan otomatis mengalihkan status ke Perawatan (Maintenance).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 border-t border-border/60 pt-3 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 gap-1.5 border-border/80"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cetak / Cetak PDF</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-4"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
