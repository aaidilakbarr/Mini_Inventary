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
import { Shield, User, Clock, Layers, FileText, CheckCircle2 } from "lucide-react"
import type { AuditLog } from "@/types/database"

interface AuditDetailModalProps {
  isOpen: boolean
  onClose: () => void
  log: AuditLog | null
}

export function AuditDetailModal({ isOpen, onClose, log }: AuditDetailModalProps) {
  if (!log) return null

  const getActionBadgeVariant = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('ADD')) return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-500/15 text-blue-600 border-blue-500/30'
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-rose-500/15 text-rose-600 border-rose-500/30'
    if (act.includes('APPROVE')) return 'bg-teal-500/15 text-teal-600 border-teal-500/30'
    if (act.includes('REJECT')) return 'bg-red-500/15 text-red-600 border-red-500/30'
    if (act.includes('RETURN')) return 'bg-purple-500/15 text-purple-600 border-purple-500/30'
    return 'bg-amber-500/15 text-amber-600 border-amber-500/30'
  }

  const detailsObj = log.details || {}
  const hasDetails = Object.keys(detailsObj).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Detail Rekaman Audit Log</DialogTitle>
              <DialogDescription>
                Informasi detail dan data muatan perubahan yang tercatat di sistem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/70">
            {/* Waktu */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Waktu & Tanggal
              </span>
              <p className="font-semibold text-foreground">
                {formatDateID(log.created_at)}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </p>
            </div>

            {/* Aksi */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                Jenis Aksi & Target
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={`font-mono text-[10px] font-bold ${getActionBadgeVariant(log.action)}`}>
                  {log.action}
                </Badge>
                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                  {log.entity_type}
                </Badge>
              </div>
            </div>

            {/* Pelaku / Aktor */}
            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/50">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Aktor / Pelaku
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                    {log.user?.full_name ? log.user.full_name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-tight">
                      {log.user?.full_name || 'Sistem Otomatis (Database Trigger / Cron)'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.user?.email || 'system@internal.automated'}
                    </p>
                  </div>
                </div>
                <Badge variant={log.user?.role === 'admin' ? 'default' : 'outline'} className="text-[9px] uppercase font-mono">
                  {log.user?.role || 'SYSTEM'}
                </Badge>
              </div>
            </div>

            {/* Entity Target ID */}
            {log.entity_id && (
              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Entity ID
                </span>
                <p className="font-mono text-[11px] bg-background px-2 py-1 rounded border border-border/70 text-foreground break-all">
                  {log.entity_id}
                </p>
              </div>
            )}
          </div>

          {/* Details Payload Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Muatan Data & Perubahan (JSON Payload)
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {hasDetails ? `${Object.keys(detailsObj).length} atribut` : 'Kosong'}
              </span>
            </div>

            {hasDetails ? (
              <div className="p-3 rounded-lg bg-muted/60 border border-border/80 font-mono text-[11px] text-foreground max-h-56 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(detailsObj, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center text-muted-foreground text-xs italic">
                Tidak ada data perubahan tambahan yang dilampirkan pada aksi ini.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
