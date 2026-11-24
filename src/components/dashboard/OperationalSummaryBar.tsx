import { Activity, RefreshCw, Download, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
    <Card className="p-3.5 sm:px-4 sm:py-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Label + Timestamp */}
        <div className="flex items-center justify-between lg:justify-start gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-foreground">
                Operasional
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground">
                {lastUpdated || "Baru saja"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Solid Attention Badge when > 0 */}
        {actionableCount > 0 && (
          <div className="flex items-center lg:justify-center min-w-0">
            <Badge
              variant="warning"
              className="h-7 px-3 rounded-lg text-xs max-w-full truncate gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {actionableCount} perlu perhatian ({actionableSummary})
              </span>
            </Badge>
          </div>
        )}

        {/* Right: Mobile-First Touch-Friendly Actions */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="w-full sm:w-auto"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ekspor</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                isLoading ? "animate-spin text-primary" : ""
              }`}
            />
            <span>Segarkan</span>
          </Button>

          {canAddInventory && onAddInventory && (
            <Button
              type="button"
              size="sm"
              onClick={onAddInventory}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Inventaris</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
