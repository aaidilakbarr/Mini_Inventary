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
import { formatDateID, formatDateTimeID } from "@/lib/formatters"
import {
  Package,
  Boxes,
  MapPin,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
  Wrench,
  FileText,
  Tag,
  Copy,
  Check,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeftRight
} from "lucide-react"
import type { InventoryItem } from "@/types/database"

interface InventoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  isAdmin?: boolean
  onBorrow?: (item: InventoryItem) => void
  onEdit?: (item: InventoryItem) => void
}

export function InventoryDetailModal({
  isOpen,
  onClose,
  item,
  isAdmin = false,
  onBorrow,
  onEdit,
}: InventoryDetailModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  if (!item) return null

  const handleCopyCode = () => {
    if (item.code) {
      navigator.clipboard.writeText(item.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Parse structured notes if any
  const noteLines = item.notes ? item.notes.split('\n').filter(Boolean) : []

  const getStatusBadge = () => {
    switch (item.status) {
      case "Available":
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Tersedia
          </Badge>
        )
      case "Borrowed":
        return (
          <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-mono font-bold">
            <Clock className="h-3 w-3 mr-1" />
            Dipinjam
          </Badge>
        )
      case "Maintenance":
        return (
          <Badge variant="destructive" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-mono font-bold">
            <Wrench className="h-3 w-3 mr-1" />
            Perawatan (Maintenance)
          </Badge>
        )
      case "Lost":
        return (
          <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-mono font-bold">
            <AlertCircle className="h-3 w-3 mr-1" />
            Hilang
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs font-mono">
            {item.status}
          </Badge>
        )
    }
  }

  const getConditionBadge = () => {
    const cond = item.condition || "Bagus"
    const isDamaged = cond.toLowerCase().includes("rusak") || cond.toLowerCase().includes("perbaikan")
    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium ${isDamaged
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
          }`}
      >
        {cond}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {item.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>Kode Aset:</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 font-mono font-bold text-foreground hover:text-primary transition-colors bg-muted/60 px-1.5 py-0.5 rounded text-[11px]"
                    title="Klik untuk salin kode aset"
                  >
                    <span>{item.code}</span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  {isCopied && <span className="text-[10px] text-emerald-500 font-medium">Disalin!</span>}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {getConditionBadge()}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Visual Showcase (if asset has a photo) */}
          {item.photo_url && (
            <div className="rounded-2xl border border-border/80 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 flex flex-col sm:flex-row items-center gap-4 overflow-hidden shadow-2xs group">
              <div className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-background border border-border/60 flex items-center justify-center shadow-xs">
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto Resmi Unit Aset
                </span>
                <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Tersimpan pada penyimpanan cloud inventaris. Gunakan tautan di bawah untuk melihat foto resolusi penuh.
                </p>
                <div className="pt-1">
                  <a
                    href={item.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <span>Buka Foto Resolusi Penuh</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Boxes className="h-3.5 w-3.5" />
                <span>Jumlah Stok</span>
              </div>
              <p className="text-base font-mono font-bold text-foreground">
                {item.quantity} <span className="text-xs font-normal text-muted-foreground">unit</span>
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Tag className="h-3.5 w-3.5" />
                <span>Kategori</span>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">
                {item.category?.name || "Umum"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <MapPin className="h-3.5 w-3.5" />
                <span>Lokasi</span>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">
                {item.location || "-"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Garansi</span>
              </div>
              <p className="text-xs font-mono font-semibold text-foreground truncate">
                {item.warranty_info || "-"}
              </p>
            </div>
          </div>

          {/* Detailed Information Section */}
          <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
            <div className="px-3.5 py-2 bg-muted/30 border-b border-border/60">
              <span className="text-[11px] font-mono uppercase font-semibold text-foreground">
                Informasi & Spesifikasi Aset
              </span>
            </div>
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Pemasok / Vendor
                </span>
                <p className="font-semibold text-foreground">
                  {item.supplier || "Vendor internal / tidak tercatat"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Lokasi Penyimpanan
                </span>
                <p className="font-semibold text-foreground">
                  {item.location || "Gudang Utama"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Tanggal Didaftarkan
                </span>
                <p className="font-mono text-foreground">
                  {formatDateID(item.created_at)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pembaruan Terakhir
                </span>
                <p className="font-mono text-foreground">
                  {formatDateTimeID(item.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes & History Section */}
          <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
            <div className="px-3.5 py-2 bg-muted/30 border-b border-border/60 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Catatan & Riwayat Aset
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {noteLines.length} catatan
              </span>
            </div>
            <div className="p-3.5 space-y-2 max-h-48 overflow-y-auto">
              {noteLines.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-2 text-xs">
                  Tidak ada catatan tambahan untuk aset ini.
                </p>
              ) : (
                noteLines.map((line, idx) => {
                  const isReturn = line.includes("[Pengembalian")
                  const isRepair = line.includes("[Perbaikan")

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-md border text-xs leading-relaxed ${isReturn
                          ? "bg-amber-500/5 border-amber-500/20 text-foreground"
                          : isRepair
                            ? "bg-emerald-500/5 border-emerald-500/20 text-foreground"
                            : "bg-muted/30 border-border/60 text-foreground"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        {isReturn && <Wrench className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />}
                        {isRepair && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                        {!isReturn && !isRepair && <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                        <span className="break-words">{line}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-border/60 pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 sm:h-8 text-xs rounded-xl flex-1 sm:flex-none justify-center"
            >
              Tutup
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={item.status !== "Available" || (item.quantity ?? 0) <= 0}
              onClick={() => {
                onClose()
                onBorrow?.(item)
              }}
              className="h-9 sm:h-8 text-xs gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex-1 sm:flex-none justify-center"
              title={
                item.status !== "Available" || (item.quantity ?? 0) <= 0
                  ? "Aset tidak tersedia untuk dipinjam saat ini"
                  : "Ajukan Permohonan Peminjaman Aset"
              }
            >
              <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
              <span>Pinjam Barang</span>
            </Button>
          </div>

          {isAdmin && onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose()
                onEdit(item)
              }}
              className="h-9 sm:h-8 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground w-full sm:w-auto justify-center"
            >
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              <span>Edit Aset Ini</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
