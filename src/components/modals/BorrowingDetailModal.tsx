import { useState } from "react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  Building2,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Camera,
  ArrowLeftRight,
  MapPin,
  Check,
  Sparkles
} from "lucide-react"
import type { BorrowingItem } from "@/types/database"

interface BorrowingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: BorrowingItem | null
  onReturnClick?: (item: BorrowingItem) => void
  canReturn?: boolean
}

export function BorrowingDetailModal({ 
  isOpen, 
  onClose, 
  item,
  onReturnClick,
  canReturn = false,
}: BorrowingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("lending")

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
  const isRejected = item.status === "Rejected"

  // Check overdue
  const isOverdue = !isReturned && item.due_date && new Date(item.due_date) < new Date()

  const handlePrint = () => {
    window.print()
  }

  const transactionCode = `#BOR-${item.id.slice(0, 8).toUpperCase()}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6 rounded-2xl print:p-0 print:border-none print:shadow-none print:max-w-full">
        
        {/* === SCREEN VIEW: HEADER === */}
        <DialogHeader className="border-b border-border/60 pb-3 sm:pb-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <DialogTitle className="text-sm sm:text-lg font-bold text-foreground">
                    Formulir Peminjaman & Verifikasi
                  </DialogTitle>
                  <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                    {transactionCode}
                  </span>
                </div>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Dokumen serah terima dan status verifikasi fisik aset.
                </DialogDescription>
              </div>
            </div>

            {/* Main Status Badge */}
            <Badge 
              variant={
                isReturned ? "outline" :
                isBorrowed ? "default" :
                isPending ? "secondary" : "destructive"
              }
              className={`text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 sm:py-1 shrink-0 self-start sm:self-center ${
                isReturned ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" :
                isBorrowed ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" :
                isPending ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" :
                "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
              }`}
            >
              {isReturned ? "✓ Sudah Dikembalikan" :
               isBorrowed ? "● Sedang Dipinjam" :
               isPending ? "⏳ Menunggu Persetujuan" : "✕ Ditolak"}
            </Badge>
          </div>
        </DialogHeader>

        {/* === SCREEN VIEW: LIFECYCLE MILESTONE STRIP === */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1.5 sm:py-2 print:hidden">
          <div className="p-2 sm:p-2.5 rounded-xl border border-border/60 bg-muted/20">
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
              Pengajuan
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-medium text-foreground mt-0.5 block truncate">
              {formatDateID(item.request_date)}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl border border-border/60 bg-muted/20">
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
              Mulai Pinjam
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-medium text-foreground mt-0.5 block truncate">
              {item.start_date ? formatDateID(item.start_date) : "-"}
            </span>
          </div>

          <div className={`p-2 sm:p-2.5 rounded-xl border ${
            isOverdue 
              ? "border-rose-500/40 bg-rose-500/5" 
              : "border-border/60 bg-muted/20"
          }`}>
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between">
              <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"}>
                Jatuh Tempo
              </span>
              {isOverdue && (
                <span className="text-[8px] sm:text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400">
                  Terlambat
                </span>
              )}
            </span>
            <span className={`text-[11px] sm:text-xs font-mono font-semibold mt-0.5 block truncate ${
              isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            }`}>
              {formatDateID(item.due_date)}
            </span>
          </div>

          <div className={`p-2 sm:p-2.5 rounded-xl border ${
            isReturned
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border/60 bg-muted/20"
          }`}>
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
              Pengembalian
            </span>
            <span className={`text-[11px] sm:text-xs font-mono font-semibold mt-0.5 block truncate ${
              isReturned ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
            }`}>
              {item.return_date ? formatDateID(item.return_date) : "Belum Kembali"}
            </span>
          </div>
        </div>

        {/* === SCREEN VIEW: TABBED SEGMENTED VIEW (OPTION C) === */}
        <div className="print:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-xl border border-border/60 items-center mb-3">
              <TabsTrigger
                value="lending"
                className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "lending"
                    ? "bg-background text-foreground shadow-xs font-bold border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PackageCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="hidden sm:inline">1. Detail Peminjaman</span>
                <span className="sm:hidden">1. Peminjaman</span>
              </TabsTrigger>
              <TabsTrigger
                value="return"
                className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "return"
                    ? "bg-background text-foreground shadow-xs font-bold border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RotateCcw className={`h-3.5 w-3.5 shrink-0 ${isReturned ? "text-emerald-600" : "text-muted-foreground"}`} />
                <span className="hidden sm:inline">2. Verifikasi Pengembalian</span>
                <span className="sm:hidden">2. Pengembalian</span>
                {isReturned && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: DETAIL PEMINJAMAN (SERAH TERIMA AWAL) */}
            <TabsContent value="lending" className="space-y-3 sm:space-y-3.5 outline-hidden">
              {/* Asset & Borrower Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Asset Card */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <PackageCheck className="h-3.5 w-3.5 text-primary" />
                      Informasi Aset
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {item.inventory?.code || "-"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                      {item.inventory?.name || "Aset Inventaris"}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground text-[10px] font-medium">
                        {item.inventory?.category?.name || "Umum"}
                      </span>
                      {item.inventory?.location && (
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {item.inventory.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Kondisi Serah Terima:</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-medium">
                      ✓ Baik / Normal
                    </Badge>
                  </div>
                </div>

                {/* Borrower Card */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      Identitas Peminjam
                    </span>
                    <Badge variant="secondary" className="text-[10px] capitalize font-medium">
                      {item.borrower?.role || "Staf"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                      {item.borrower?.full_name || "Tanpa Nama"}
                    </h4>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      {item.borrower?.email || "-"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Tanggal Pengajuan:</span>
                    <span className="font-mono font-medium text-foreground text-[11px]">
                      {formatDateID(item.request_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose / Catatan Peminjaman */}
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                  Keperluan / Catatan Peminjaman
                </span>
                <p className="text-xs text-foreground font-mono leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/40 min-h-[36px]">
                  {initialNotes || "Tidak ada catatan keperluan khusus dicantumkan saat pengajuan."}
                </p>
              </div>

              {/* Foto Barang Saat Dipinjam (Future-ready slot) */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    Dokumentasi Foto Serah Terima
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Slot Dokumentasi</span>
                </div>
                <div className="py-3 sm:py-4 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center mb-1">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Belum ada foto serah terima</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Dokumentasi visual kondisi fisik aset saat diserahkan ke peminjam.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: VERIFIKASI PENGEMBALIAN */}
            <TabsContent value="return" className="space-y-3 sm:space-y-3.5 outline-hidden">
              {isReturned ? (
                <>
                  {/* Verification Outcome Banner */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Hasil Pemeriksaan Fisik
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                        Diverifikasi: <strong className="text-foreground">{item.return_date ? formatDateID(item.return_date) : "-"}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg border border-border/50 bg-background space-y-1">
                        <span className="text-[10px] text-muted-foreground block">Kondisi Fisik Aktual</span>
                        <Badge 
                          variant="outline"
                          className={`text-xs font-mono font-bold ${
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
                      </div>

                      <div className="p-2.5 rounded-lg border border-border/50 bg-background space-y-1">
                        <span className="text-[10px] text-muted-foreground block">Status Inventaris Pasca-Kembali</span>
                        <Badge 
                          variant="outline"
                          className={`text-xs font-mono font-bold ${
                            returnCondition === "Bagus"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {returnCondition === "Bagus" ? "Tersedia (Available)" : "Perawatan (Maintenance)"}
                        </Badge>
                      </div>
                    </div>

                    {/* Return Notes */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                        Catatan Pemeriksaan Pengembalian
                      </span>
                      <p className="text-xs text-foreground font-mono leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/40 min-h-[36px]">
                        {returnNotes || "Aset kembali lengkap dan berfungsi normal tanpa catatan kendala."}
                      </p>
                    </div>
                  </div>

                  {/* Foto Barang Saat Dikembalikan (Future-ready slot) */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                        Dokumentasi Foto Pengembalian
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Slot Dokumentasi</span>
                    </div>
                    <div className="py-3 sm:py-4 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center mb-1">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Belum ada foto pengembalian</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Dokumentasi visual kondisi fisik aset saat diterima kembali oleh petugas.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty / Pending State: Clean & Minimalist without walls of text */
                <div className="p-4 sm:p-6 rounded-xl border border-border/70 bg-muted/15 flex flex-col items-center justify-center text-center space-y-2.5 sm:space-y-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                  <div className="max-w-xs">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      Pemeriksaan Belum Dilakukan
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                      Aset masih berada pada peminjam. Verifikasi kondisi fisik akan dicatat saat proses pengembalian dilakukan.
                    </p>
                  </div>
                  {isBorrowed && canReturn && onReturnClick && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onReturnClick(item)}
                      className="mt-1 sm:mt-2 text-xs h-9 sm:h-8 px-3.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto rounded-xl"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Proses Pengembalian Sekarang</span>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* === PRINT VIEW: OFFICIAL BERITA ACARA SERAH TERIMA (BAST) === */}
        <div className="hidden print:block text-black space-y-5 p-4 font-sans">
          {/* Header BAST */}
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-lg font-bold tracking-tight uppercase">
              Berita Acara Peminjaman & Verifikasi Aset
            </h2>
            <p className="text-xs mt-0.5 font-mono text-gray-600">
              No. Transaksi: {transactionCode} • Tanggal Dokumen: {formatDateID(new Date().toISOString())}
            </p>
          </div>

          {/* Table Data */}
          <table className="w-full text-xs border-collapse border border-gray-400">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100 w-1/4">Nama Aset</td>
                <td className="p-2 w-1/4 font-bold">{item.inventory?.name || "-"}</td>
                <td className="p-2 font-semibold bg-gray-100 w-1/4">Kode Aset</td>
                <td className="p-2 w-1/4 font-mono">{item.inventory?.code || "-"}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100">Kategori</td>
                <td className="p-2">{item.inventory?.category?.name || "-"}</td>
                <td className="p-2 font-semibold bg-gray-100">Lokasi Simpan</td>
                <td className="p-2">{item.inventory?.location || "-"}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100">Nama Peminjam</td>
                <td className="p-2 font-bold">{item.borrower?.full_name || "-"}</td>
                <td className="p-2 font-semibold bg-gray-100">Email & Peran</td>
                <td className="p-2">{item.borrower?.email || "-"} ({item.borrower?.role || "-"})</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100">Tgl Pengajuan</td>
                <td className="p-2 font-mono">{formatDateID(item.request_date)}</td>
                <td className="p-2 font-semibold bg-gray-100">Tenggat Waktu</td>
                <td className="p-2 font-mono font-bold">{formatDateID(item.due_date)}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100">Kondisi Serah Terima</td>
                <td className="p-2 font-semibold">Baik & Normal</td>
                <td className="p-2 font-semibold bg-gray-100">Status Peminjaman</td>
                <td className="p-2 font-bold">{item.status}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-100">Tgl Pengembalian</td>
                <td className="p-2 font-mono">{item.return_date ? formatDateID(item.return_date) : "Belum Dikembalikan"}</td>
                <td className="p-2 font-semibold bg-gray-100">Kondisi Fisik Kembali</td>
                <td className="p-2 font-bold">{returnCondition || "-"}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold bg-gray-100">Catatan Pengembalian</td>
                <td colSpan={3} className="p-2 font-mono">{returnNotes || initialNotes || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* Tanda Tangan Para Pihak */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs gap-12">
            <div>
              <p className="font-semibold">Pihak Peminjam,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{item.borrower?.full_name || "......................................."}</p>
              <p className="text-[10px] text-gray-600">ID: {item.borrower?.email || "-"}</p>
            </div>
            <div>
              <p className="font-semibold">Petugas Inventaris / Verifikator,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">.......................................</p>
              <p className="text-[10px] text-gray-600">Petugas Pengelola Aset</p>
            </div>
          </div>
        </div>

        {/* === SCREEN VIEW: FOOTER (MOBILE OPTIMIZED) === */}
        <DialogFooter className="mt-2 border-t border-border/60 pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 w-full print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-9 sm:h-8 gap-1.5 border-border/80 hover:bg-muted w-full sm:w-auto rounded-xl"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cetak Dokumen</span>
          </Button>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant={isBorrowed && canReturn && onReturnClick ? "outline" : "default"}
              size="sm"
              onClick={onClose}
              className="text-xs h-9 sm:h-8 px-4 w-full sm:w-auto rounded-xl"
            >
              Tutup
            </Button>
            {isBorrowed && canReturn && onReturnClick && (
              <Button
                type="button"
                size="sm"
                onClick={() => onReturnClick(item)}
                className="text-xs h-9 sm:h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Verifikasi Pengembalian</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

