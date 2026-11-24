import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { formatDateID } from "@/lib/formatters"
import type { AuditLog } from "@/types/database"

interface AuditDetailModalProps {
  isOpen: boolean
  onClose: () => void
  log: AuditLog | null
}

export function AuditDetailModal({ isOpen, onClose, log }: AuditDetailModalProps) {
  if (!log) return null

  const getActionVariant = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("APPROVE")) return "success" as const
    if (act.includes("UPDATE") || act.includes("EDIT")) return "info" as const
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REJECT")) return "destructive" as const
    if (act.includes("RETURN")) return "secondary" as const
    return "warning" as const
  }

  const detailsObj = log.details || {}
  const hasDetails = Object.keys(detailsObj).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Log Audit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Waktu</span>
              <p className="font-semibold text-foreground">{formatDateID(log.created_at)}</p>
              <p className="text-[11px] font-mono text-muted-foreground">
                {new Date(log.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                WIB
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Aksi & Modul</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={getActionVariant(log.action)} className="font-mono text-[10px]">
                  {log.action}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {log.entity_type}
                </Badge>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Aktor</span>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {log.user?.full_name || "Sistem"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {log.user?.email || "otomatis"}
                  </p>
                </div>
                <Badge variant={log.user?.role === "admin" ? "default" : "outline"} className="uppercase font-mono text-[10px]">
                  {log.user?.role || "SYSTEM"}
                </Badge>
              </div>
            </div>

            {log.entity_id && (
              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">Entity ID</span>
                <p className="font-mono text-[11px] text-foreground break-all">{log.entity_id}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Payload JSON</Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {hasDetails ? `${Object.keys(detailsObj).length} field` : "Kosong"}
              </span>
            </div>

            {hasDetails ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-[11px] text-foreground max-h-56 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(detailsObj, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-center text-muted-foreground">
                Tidak ada detail tambahan.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
