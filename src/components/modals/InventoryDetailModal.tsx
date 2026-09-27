import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { formatDateID, formatDateTimeID, formatCurrencyID } from "@/lib/formatters"
import {
  Package,
  Boxes,
  MapPin,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
  FileText,
  Tag,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  ArrowLeftRight,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Wrench,
  History,
  SlidersHorizontal,
} from "lucide-react"
import type { InventoryItem } from "@/types/database"
import { cn } from "@/lib/utils"

interface InventoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  isAdmin?: boolean
  onBorrow?: (item: InventoryItem) => void
  onEdit?: (item: InventoryItem) => void
}

interface ParsedNote {
  raw: string
  tag: string
  date?: string
  content: string
  type: "return" | "repair" | "maintenance" | "general"
}

function parseNoteLine(line: string): ParsedNote {
  const trimmed = line.trim()
  const match = trimmed.match(/^\[(.*?)\]:\s*(.*)$/)
  if (match) {
    const fullTag = match[1].trim()
    const content = match[2].trim()

    // Extract date if present (e.g. "4/9/2026")
    const dateMatch = fullTag.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
    const date = dateMatch ? dateMatch[1] : undefined
    const cleanTag = dateMatch
      ? fullTag.replace(dateMatch[1], "").trim()
      : fullTag

    const lower = fullTag.toLowerCase()
    let type: "return" | "repair" | "maintenance" | "general" = "general"
    if (lower.includes("pengembalian")) {
      type = "return"
    } else if (lower.includes("perbaikan") || lower.includes("selesai")) {
      type = "repair"
    } else if (lower.includes("maintenance") || lower.includes("rusak")) {
      type = "maintenance"
    }

    return {
      raw: trimmed,
      tag: cleanTag || fullTag,
      date,
      content,
      type,
    }
  }

  return { raw: trimmed, tag: "Catatan", content: trimmed, type: "general" }
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("specs")

  if (!item) return null

  const handleCopyCode = () => {
    if (item.code) {
      navigator.clipboard.writeText(item.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Parse structured notes into timeline events
  const noteLines = item.notes
    ? item.notes.split("\n").map((l) => l.trim()).filter(Boolean)
    : []
  const parsedNotes: ParsedNote[] = noteLines.map(parseNoteLine)

  const getStatusBadge = () => {
    switch (item.status) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tersedia
          </span>
        )
      case "Borrowed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Dipinjam
          </span>
        )
      case "Maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Perawatan
          </span>
        )
      case "Lost":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Hilang
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {item.status}
          </span>
        )
    }
  }

  const getConditionBadge = () => {
    const cond = item.condition || "Bagus"
    const isDamaged = cond.toLowerCase().includes("rusak") || cond.toLowerCase().includes("perbaikan")
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
          isDamaged
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
            : "bg-slate-100 dark:bg-muted/60 text-slate-700 dark:text-slate-300 border-border/80"
        )}
      >
        {cond}
      </span>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl border-border/80 shadow-2xl">
          {/* Header & Hero Info */}
          <DialogHeader className="space-y-0 text-left pb-4 border-b border-border/60">
            <div className="flex items-center gap-3.5 pr-8">
              {/* Asset Photo Thumbnail or Icon */}
              {item.photo_url ? (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-muted/30 border border-border/80 shrink-0 group focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all hover:border-primary/50 shadow-2xs"
                  title="Klik untuk melihat foto penuh"
                >
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </button>
              ) : (
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <Package className="h-7 w-7" />
                </div>
              )}

              {/* Title & Identity */}
              <div className="flex-1 min-w-0 space-y-1">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-tight truncate">
                  {item.name}
                </DialogTitle>

                <DialogDescription className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {/* Status & Condition Badges */}
                  {getStatusBadge()}
                  {getConditionBadge()}

                  {/* Asset Code with Copy Action */}
                  <span className="text-border">•</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 font-mono font-medium text-foreground hover:text-primary transition-colors bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded text-[11px] border border-border/50"
                    title="Klik untuk menyalin kode aset"
                  >
                    <span>{item.code}</span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  {isCopied && <span className="text-[10px] text-emerald-500 font-semibold">Tersalin!</span>}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Metrics Strip: Structured, Balanced Typography */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 my-4">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground/70" />
                Jumlah Stok
              </span>
              <p className="text-sm font-bold font-mono text-foreground">
                {item.quantity}{" "}
                <span className="text-xs font-normal text-muted-foreground">unit</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                Kategori
              </span>
              <p className="text-sm font-semibold text-foreground truncate">
                {item.category?.name || "Umum"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                Lokasi
              </span>
              <p className="text-sm font-semibold text-foreground truncate">
                {item.location || "-"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/70" />
                Garansi
              </span>
              <p className="text-sm font-semibold text-foreground truncate font-mono">
                {item.warranty_info || "-"}
              </p>
            </div>
          </div>

          {/* Tabbed Navigation: Informasi & Spesifikasi vs Catatan & Riwayat */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-3">
            <TabsList className="grid grid-cols-2 h-9 p-1 bg-muted/50 rounded-xl border border-border/60">
              <TabsTrigger
                value="specs"
                className="h-7 rounded-lg text-xs font-semibold gap-1.5 transition-all cursor-pointer data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Spesifikasi Aset</span>
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className="h-7 rounded-lg text-xs font-semibold gap-1.5 transition-all cursor-pointer data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
              >
                <History className="h-3.5 w-3.5" />
                <span>Catatan & Riwayat</span>
                {parsedNotes.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-muted-foreground/15 text-foreground">
                    {parsedNotes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Spesifikasi Aset */}
            <TabsContent value="specs" className="space-y-3 focus-visible:outline-none">
              <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden bg-background">
                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Pemasok / Vendor
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {item.supplier || "Vendor Internal"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Lokasi Penyimpanan
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {item.location || "Gudang Utama"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Tanggal Registrasi
                  </span>
                  <span className="font-mono font-medium text-foreground text-right">
                    {formatDateID(item.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Pembaruan Terakhir
                  </span>
                  <span className="font-mono font-medium text-foreground text-right">
                    {formatDateTimeID(item.updated_at)}
                  </span>
                </div>

                {item.purchase_info?.price && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                    <span className="text-muted-foreground flex items-center gap-2 font-medium">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                      Nilai Pembelian
                    </span>
                    <span className="font-mono font-semibold text-foreground text-right">
                      {formatCurrencyID(item.purchase_info.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Photo preview link if available */}
              {item.photo_url && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-muted/30 border border-border/50 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Foto Resmi Tersedia
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    <span>Perbesar Resolusi Penuh</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Catatan & Riwayat (Activity Feed) */}
            <TabsContent value="history" className="space-y-3 focus-visible:outline-none">
              {parsedNotes.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground gap-2 rounded-xl border border-dashed border-border/70 p-4">
                  <div className="h-9 w-9 rounded-full bg-muted/70 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground/70" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Tidak Ada Catatan Riwayat</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    Riwayat kondisi fisik, pengembalian, dan servis pemeliharaan akan muncul di sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden bg-background max-h-60 overflow-y-auto">
                  {parsedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 text-xs hover:bg-muted/20 transition-colors"
                    >
                      {/* Icon indicator */}
                      <div className="pt-0.5 shrink-0">
                        <span
                          className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold shrink-0",
                            note.type === "return"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : note.type === "repair"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : note.type === "maintenance"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {note.type === "return" ? (
                            <RotateCcw className="h-3 w-3" />
                          ) : note.type === "repair" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : note.type === "maintenance" ? (
                            <Wrench className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              note.type === "return"
                                ? "text-amber-700 dark:text-amber-400"
                                : note.type === "repair"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : note.type === "maintenance"
                                ? "text-blue-700 dark:text-blue-400"
                                : "text-foreground"
                            )}
                          >
                            {note.tag}
                          </span>
                          {note.date && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                              {note.date}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed break-words font-normal">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium rounded-xl border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground justify-center"
            >
              Tutup
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isAdmin && onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onEdit(item)
                  }}
                  className="h-9 px-3.5 text-xs font-medium gap-1.5 rounded-xl border-border hover:bg-muted flex-1 sm:flex-none justify-center"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Edit Aset</span>
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                disabled={item.status !== "Available" || (item.quantity ?? 0) <= 0}
                onClick={() => {
                  onClose()
                  onBorrow?.(item)
                }}
                className="h-9 px-4 text-xs font-semibold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex-1 sm:flex-none justify-center"
                title={
                  item.status !== "Available" || (item.quantity ?? 0) <= 0
                    ? "Aset tidak tersedia untuk dipinjam saat ini"
                    : "Ajukan Permohonan Peminjaman Aset"
                }
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Pinjam Barang</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal for Photo Inspection */}
      {item.photo_url && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-2xl p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-2xl">
            <DialogHeader className="border-b border-border/60 pb-2.5">
              <div className="flex items-center justify-between pr-8">
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground">
                    {item.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-mono">
                    {item.code}
                  </DialogDescription>
                </div>
                <a
                  href={item.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <span>Buka Gambar Asli</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-slate-50 dark:bg-muted/20 rounded-xl max-h-[70vh] overflow-hidden my-2">
              <img
                src={item.photo_url}
                alt={item.name}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
