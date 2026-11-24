import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateID, formatDateTimeID } from "@/lib/formatters"
import { getAgendaUrgency } from "@/lib/agenda"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Wrench,
  Package,
  MapPin,
  ExternalLink,
  Loader2,
  FileText,
} from "lucide-react"
import type { ReminderItem, InventoryItem } from "@/types/database"

const SOURCE_DISPLAY: Record<string, string> = {
  manual: "Manual",
  inventory: "Perawatan Aset",
  Inventaris: "Inventaris",
  Peminjaman: "Peminjaman",
  Langganan: "Langganan",
  Perawatan: "Perawatan",
}

const STATUS_DISPLAY: Record<string, string> = {
  Upcoming: "Mendatang",
  "Due Today": "Hari Ini",
  Overdue: "Terlambat",
  Completed: "Selesai",
  Dismissed: "Diabaikan",
}

interface AgendaDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ReminderItem | null
  onToggleStatus: (item: ReminderItem) => Promise<void> | void
  onEdit: (item: ReminderItem) => void
  onDelete: (item: ReminderItem) => void
  isToggling?: boolean
}

export function AgendaDetailModal({
  open,
  onOpenChange,
  item,
  onToggleStatus,
  onEdit,
  onDelete,
  isToggling = false,
}: AgendaDetailModalProps) {
  const navigate = useNavigate()
  const [isCopied, setIsCopied] = useState(false)
  const [linkedInventory, setLinkedInventory] = useState<InventoryItem | null>(null)
  const [isLoadingAsset, setIsLoadingAsset] = useState(false)

  useEffect(() => {
    let active = true
    if (!open || !item || item.source_type !== "inventory" || !item.source_id) {
      setLinkedInventory(null)
      setIsLoadingAsset(false)
      return
    }

    const fetchLinkedAsset = async () => {
      try {
        setIsLoadingAsset(true)
        const { data } = await supabase
          .from("inventories")
          .select("*, category:categories(*)")
          .eq("id", item.source_id)
          .single()
        if (active) {
          setLinkedInventory((data as InventoryItem) || null)
        }
      } catch {
        if (active) setLinkedInventory(null)
      } finally {
        if (active) setIsLoadingAsset(false)
      }
    }

    fetchLinkedAsset()
    return () => {
      active = false
    }
  }, [open, item])

  if (!item) return null

  const urgency = getAgendaUrgency(item)
  const isDone = item.status === "Completed"
  const isRepairTicket = item.source_type === "inventory"
  const agendaCode = `#AGD-${item.id.slice(0, 8).toUpperCase()}`
  const sourceLabel = SOURCE_DISPLAY[item.source_type || "manual"] || item.source_type || "Manual"

  const handleCopyCode = () => {
    navigator.clipboard.writeText(agendaCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2 pr-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={urgency.badgeVariant}>
                {urgency.state === "overdue" && <AlertTriangle className="h-3 w-3" />}
                {urgency.state === "completed" && <CheckCircle2 className="h-3 w-3" />}
                <span>{urgency.label}</span>
              </Badge>

              <Badge
                variant={
                  item.priority === "Tinggi"
                    ? "destructive"
                    : item.priority === "Sedang"
                    ? "warning"
                    : "outline"
                }
              >
                Prioritas {item.priority}
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleCopyCode}
                className="h-5 px-1.5 font-mono text-[11px] text-muted-foreground"
                title="Salin kode agenda"
              >
                <span>{agendaCode}</span>
                {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>

            <DialogTitle className={cn("text-base sm:text-lg leading-snug break-words", isDone && "line-through text-muted-foreground")}>
              {item.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg border border-border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block">Jatuh Tempo</span>
              <span className={cn("font-mono font-semibold mt-0.5 block", urgency.state === "overdue" ? "text-destructive" : "text-foreground")}>
                {formatDateID(item.due_date)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block">Tenggat</span>
              <span className="font-semibold text-foreground mt-0.5 block">{urgency.label}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block">Sumber</span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">{sourceLabel}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block">Status</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {STATUS_DISPLAY[item.status] || item.status}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>Deskripsi & Catatan</span>
            </div>
            {item.description?.trim() ? (
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {item.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Belum ada catatan tambahan.</p>
            )}
          </div>

          {isRepairTicket && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-border bg-muted/25 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    <Wrench className="h-3.5 w-3.5 text-amber-600" />
                    <span>Aset Terkait</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      onOpenChange(false)
                      navigate("/inventory")
                    }}
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <span>Buka Inventaris</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                {isLoadingAsset ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ) : linkedInventory ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center shrink-0 overflow-hidden">
                        {linkedInventory.photo_url ? (
                          <img
                            src={linkedInventory.photo_url}
                            alt={linkedInventory.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{linkedInventory.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-mono font-semibold text-primary">{linkedInventory.code}</span>
                          <span>Stok: {linkedInventory.quantity} unit</span>
                          {linkedInventory.location && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {linkedInventory.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={linkedInventory.status === "Available" ? "success" : "warning"}>
                      {linkedInventory.status === "Available" ? "Tersedia" : linkedInventory.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Data aset terkait tidak ditemukan di inventaris.
                  </p>
                )}
              </div>

              {!isDone && (
                <Alert variant="warning" className="items-center">
                  <Wrench className="h-4 w-4 shrink-0" />
                  <span>
                    Menandai agenda perawatan ini sebagai selesai akan mengembalikan 1 unit ke stok aktif inventaris.
                  </span>
                </Alert>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border divide-y divide-border text-[11px]">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Dibuat pada</span>
              </span>
              <span className="font-mono text-foreground">{formatDateTimeID(item.created_at)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Terakhir diperbarui</span>
              </span>
              <span className="font-mono text-foreground">{formatDateTimeID(item.updated_at)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onOpenChange(false)
                onDelete(item)
              }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={`Hapus agenda ${item.title}`}
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onEdit(item)
              }}
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant={isDone ? "secondary" : "default"}
              size="sm"
              disabled={isToggling}
              onClick={() => onToggleStatus(item)}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isDone ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>{isDone ? "Buka Kembali" : "Tandai Selesai"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
