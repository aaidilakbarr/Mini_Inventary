import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateID, formatDateTimeID, formatCurrencyID } from "@/lib/formatters"
import {
  Package,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  ArrowLeftRight,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Wrench,
  FileText,
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
    const dateMatch = fullTag.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
    const date = dateMatch ? dateMatch[1] : undefined
    const cleanTag = dateMatch ? fullTag.replace(dateMatch[1], "").trim() : fullTag
    const lower = fullTag.toLowerCase()
    let type: ParsedNote["type"] = "general"
    if (lower.includes("pengembalian")) type = "return"
    else if (lower.includes("perbaikan") || lower.includes("selesai")) type = "repair"
    else if (lower.includes("maintenance") || lower.includes("rusak")) type = "maintenance"
    return { raw: trimmed, tag: cleanTag || fullTag, date, content, type }
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
  const [activeTab, setActiveTab] = useState("specs")

  if (!item) return null

  const handleCopyCode = () => {
    if (!item.code) return
    navigator.clipboard.writeText(item.code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const parsedNotes = item.notes
    ? item.notes.split("\n").map((l) => l.trim()).filter(Boolean).map(parseNoteLine)
    : []

  const renderStatusBadge = () => {
    if (item.status === "Available") return <Badge variant="success">Tersedia</Badge>
    if (item.status === "Borrowed") return <Badge variant="info">Dipinjam</Badge>
    if (item.status === "Maintenance") return <Badge variant="warning">Perawatan</Badge>
    if (item.status === "Lost") return <Badge variant="destructive">Hilang</Badge>
    return <Badge variant="outline">{item.status}</Badge>
  }

  const cond = item.condition || "Bagus"
  const isDamaged = cond.toLowerCase().includes("rusak") || cond.toLowerCase().includes("perbaikan")
  const canBorrow = item.status === "Available" && (item.quantity ?? 0) > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3.5 pr-8">
              {item.photo_url ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative h-14 w-14 p-1 overflow-hidden shrink-0 group"
                  aria-label="Perbesar foto"
                >
                  <img src={item.photo_url} alt={item.name} className="h-full w-full object-contain" />
                  <span className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-background">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </span>
                </Button>
              ) : (
                <div className="h-14 w-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1.5">
                <DialogTitle className="truncate">{item.name}</DialogTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {renderStatusBadge()}
                  <Badge variant={isDamaged ? "warning" : "outline"}>{cond}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleCopyCode}
                    className="h-5 px-1.5 font-mono text-[11px] text-muted-foreground"
                    title="Salin kode"
                  >
                    <span>{item.code}</span>
                    {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Compact 4-Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border my-4 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Stok</span>
              <span className="font-mono font-semibold text-foreground">{item.quantity} unit</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Kategori</span>
              <span className="font-medium text-foreground truncate block">{item.category?.name || "Umum"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Lokasi</span>
              <span className="font-medium text-foreground truncate block">{item.location || "-"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Garansi</span>
              <span className="font-mono font-medium text-foreground truncate block">{item.warranty_info || "-"}</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || "specs")} className="space-y-3">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="specs">Spesifikasi</TabsTrigger>
              <TabsTrigger value="history">
                <span>Riwayat</span>
                {parsedNotes.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">
                    {parsedNotes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="specs">
              <div className="rounded-lg border border-border divide-y divide-border text-xs">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-muted-foreground">Vendor</span>
                  <span className="font-medium text-foreground">{item.supplier || "-"}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-muted-foreground">Lokasi</span>
                  <span className="font-medium text-foreground">{item.location || "-"}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-muted-foreground">Registrasi</span>
                  <span className="font-mono text-foreground">{formatDateID(item.created_at)}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-muted-foreground">Pembaruan</span>
                  <span className="font-mono text-foreground">{formatDateTimeID(item.updated_at)}</span>
                </div>
                {item.purchase_info?.price && (
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-muted-foreground">Nilai Beli</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrencyID(item.purchase_info.price)}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              {parsedNotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
                  Belum ada catatan riwayat.
                </div>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border max-h-56 overflow-y-auto">
                  {parsedNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 text-xs">
                      <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {note.type === "return" ? (
                          <RotateCcw className="h-3 w-3 text-amber-600" />
                        ) : note.type === "repair" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : note.type === "maintenance" ? (
                          <Wrench className="h-3 w-3 text-primary" />
                        ) : (
                          <FileText className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{note.tag}</span>
                          {note.date && (
                            <span className="text-[11px] font-mono text-muted-foreground">{note.date}</span>
                          )}
                        </div>
                        <p className="text-muted-foreground break-words">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>

            <div className="flex items-center gap-2">
              {isAdmin && onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onEdit(item)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Edit</span>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!canBorrow}
                onClick={() => {
                  onClose()
                  onBorrow?.(item)
                }}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Pinjam</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {item.photo_url && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle>{item.name}</DialogTitle>
                <a
                  href={item.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <span>Buka Asli</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-muted/40 rounded-lg max-h-[70vh] overflow-hidden mt-3">
              <img
                src={item.photo_url}
                alt={item.name}
                className="max-h-[60vh] max-w-full object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
