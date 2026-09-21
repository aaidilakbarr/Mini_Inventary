import { Activity, RefreshCw, Download, Plus, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OperationalSummaryBarProps {
  lastUpdated: string
  actionableCount: number
  actionableSummary: string
  isLoading: boolean
  onRefresh: () => void
  onExport: () => void
  onAddInventory?: () => void
  canAddInventory?: boolean
}

export function OperationalSummaryBar({
  lastUpdated,
  actionableCount,
  actionableSummary,
  isLoading,
  onRefresh,
  onExport,
  onAddInventory,
  canAddInventory = true,
}: OperationalSummaryBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card shadow-xs">
      {/* Left side: Icon, title, last-updated */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border/60 flex items-center justify-center text-primary shrink-0">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-foreground">
              Ringkasan Operasional
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground sm:hidden font-mono mt-0.5">
            Pembaruan: {lastUpdated || "Baru saja"}
          </p>
        </div>
      </div>

      {/* Centre: Alert Summary Chip */}
      <div className="flex items-center justify-start lg:justify-center min-w-0">
        {actionableCount > 0 ? (
          <div className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-medium max-w-full truncate shadow-2xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">
              <strong className="font-semibold">{actionableCount} aktivitas</strong> memerlukan perhatian ({actionableSummary})
            </span>
          </div>
        ) : (
          <div className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-2xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Semua operasional berjalan optimal</span>
          </div>
        )}
      </div>

      {/* Right side: Actions (Export, Refresh, Add Inventory) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
        {/* Export Button */}
        <Button
          variant="outline"
          onClick={onExport}
          className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border/80 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/70 text-slate-700 dark:text-slate-200 gap-2 cursor-pointer shadow-2xs transition-all active:scale-[0.98] flex-1 sm:flex-none justify-center"
          title="Ekspor ringkasan operasional ke CSV"
        >
          <Download className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span>Ekspor</span>
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border/80 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/70 text-slate-700 dark:text-slate-200 gap-2 cursor-pointer shadow-2xs transition-all active:scale-[0.98] flex-1 sm:flex-none justify-center"
          title="Segarkan data terbaru"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span>Segarkan</span>
        </Button>

        {/* Primary Add Inventory Button */}
        {canAddInventory && onAddInventory && (
          <Button
            onClick={onAddInventory}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 cursor-pointer shadow-sm shadow-primary/25 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 stroke-[2.2] shrink-0" />
            <span>Tambah Inventaris</span>
          </Button>
        )}
      </div>
    </div>
  )
}
