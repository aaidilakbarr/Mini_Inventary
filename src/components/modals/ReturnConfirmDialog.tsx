import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import {
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Wrench,
} from "lucide-react"
import { formatDateID } from "@/lib/formatters"
import { cn } from "@/lib/utils"
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
  error?: string | null
}

export function ReturnConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isLoading = false,
  error = null,
}: ReturnConfirmDialogProps) {
  const [condition, setCondition] = useState<ReturnConditionType>("Bagus")
  const [notes, setNotes] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

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
      setValidationError("Rincian kerusakan wajib diisi.")
      return
    }
    setValidationError(null)
    onConfirm({ condition, notes: notes.trim() })
  }

  const options: Array<{
    value: ReturnConditionType
    label: string
    icon: React.ElementType
    activeClass: string
    iconClass: string
  }> = [
    {
      value: "Bagus",
      label: "Bagus",
      icon: CheckCircle2,
      activeClass: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
      iconClass: "text-emerald-600",
    },
    {
      value: "Rusak Ringan",
      label: "Rusak Ringan",
      icon: AlertTriangle,
      activeClass: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      iconClass: "text-amber-600",
    },
    {
      value: "Rusak Berat",
      label: "Rusak Berat",
      icon: AlertOctagon,
      activeClass: "border-destructive bg-destructive/10 text-destructive",
      iconClass: "text-destructive",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifikasi Pengembalian</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {error && (
            <Alert variant="destructive" className="items-center">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </Alert>
          )}

          {/* Summary */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {item.inventory?.name || "Aset"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {item.inventory?.code || "-"}
                </p>
              </div>
              <Badge variant="outline">{item.inventory?.condition || "Baik"}</Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>{item.borrower?.full_name || "Tanpa Nama"}</span>
              <span className="font-mono">Tenggat: {formatDateID(item.due_date)}</span>
            </div>
          </div>

          {/* Condition Selector */}
          <div className="space-y-2">
            <Label className="text-xs">
              Kondisi Fisik <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {options.map((opt) => {
                const Icon = opt.icon
                const isSelected = condition === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCondition(opt.value)
                      setValidationError(null)
                    }}
                    className={cn(
                      "h-11 justify-start sm:justify-center gap-2 px-3",
                      isSelected && opt.activeClass
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isSelected ? opt.iconClass : "text-muted-foreground")} />
                    <span>{opt.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Status Impact */}
          <Alert variant={condition === "Bagus" ? "success" : condition === "Rusak Ringan" ? "warning" : "destructive"} className="items-center">
            {condition === "Bagus" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : condition === "Rusak Ringan" ? (
              <Wrench className="h-4 w-4 shrink-0" />
            ) : (
              <AlertOctagon className="h-4 w-4 shrink-0" />
            )}
            <span>
              {condition === "Bagus"
                ? "Aset kembali ke status Tersedia."
                : condition === "Rusak Ringan"
                ? "Aset dialihkan ke status Perawatan."
                : "Aset dinonaktifkan & dijadwalkan servis prioritas tinggi."}
            </span>
          </Alert>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="return-notes" className="text-xs">
              Catatan {isDamaged ? <span className="text-destructive">*</span> : "(Opsional)"}
            </Label>
            <Textarea
              id="return-notes"
              rows={3}
              aria-invalid={Boolean(validationError)}
              placeholder={isDamaged ? "Jelaskan kerusakan yang ditemukan..." : "Kelengkapan unit (opsional)..."}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (validationError) setValidationError(null)
              }}
            />
            {validationError && <p className="text-[11px] text-destructive">{validationError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            type="button"
            variant={condition === "Rusak Berat" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirmSubmit}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            <span>{condition === "Bagus" ? "Selesaikan Pengembalian" : "Simpan & Jadwalkan Servis"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
