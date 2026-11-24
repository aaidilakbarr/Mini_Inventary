import { Link } from "react-router-dom"
import { Package, ArrowLeftRight, AlertCircle, CheckCircle2, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DashboardStats } from "@/lib/api/dashboard"

interface PrimaryMetricCardsProps {
  stats: DashboardStats
  onActionableClick?: () => void
}

export function PrimaryMetricCards({ stats }: PrimaryMetricCardsProps) {
  const hasActionable = stats.actionableCount > 0
  const availablePct =
    stats.totalInventories > 0
      ? Math.round((stats.availableInventories / stats.totalInventories) * 100)
      : 0

  const b = stats.actionableBreakdown
  const actionableChips = [
    b.overdueBorrowings > 0 && { label: `${b.overdueBorrowings} terlambat`, variant: "destructive" as const },
    b.pendingBorrowings > 0 && { label: `${b.pendingBorrowings} menunggu`, variant: "warning" as const },
    b.damagedInventories > 0 && { label: `${b.damagedInventories} rusak`, variant: "destructive" as const },
    b.maintenanceInventories > 0 && { label: `${b.maintenanceInventories} perawatan`, variant: "warning" as const },
    b.lowStockInventories > 0 && { label: `${b.lowStockInventories} stok tipis`, variant: "warning" as const },
    b.upcomingRenewals > 0 && { label: `${b.upcomingRenewals} tagihan`, variant: "info" as const },
  ].filter(Boolean) as Array<{ label: string; variant: "destructive" | "warning" | "info" }>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Total Inventaris: Hero Primary Card with Availability Ratio Bar */}
      <Link
        to="/inventory"
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Card className="h-full border-t-2 border-t-primary card-interactive hover:border-primary/50 cursor-pointer">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground">
                  Total Inventaris
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                  {stats.totalInventories.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Package className="h-5 w-5" />
              </div>
            </div>

            {/* Real availability progress meter */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">Ketersediaan unit</span>
                <span className="font-mono font-bold text-foreground tabular-nums">{availablePct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 animate-bar"
                  style={{ width: `${availablePct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <Badge variant="success">{stats.availableInventories} tersedia</Badge>
                {stats.borrowedInventories > 0 && (
                  <Badge variant="info">{stats.borrowedInventories} dipinjam</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Peminjaman Aktif: Split Mini-Metric Card */}
      <Link
        to="/borrowing"
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Card className="h-full card-interactive hover:border-primary/40 cursor-pointer">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground">
                  Peminjaman Aktif
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                  {stats.activeBorrowings.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
            </div>

            {/* 2-Column Compact Status Split */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70">
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Menunggu</span>
                <Badge variant={stats.pendingBorrowings > 0 ? "warning" : "outline"} className="font-mono">
                  {stats.pendingBorrowings}
                </Badge>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Terlambat</span>
                <Badge variant={stats.overdueBorrowings > 0 ? "destructive" : "outline"} className="font-mono">
                  {stats.overdueBorrowings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Perlu Tindakan: Conditional Tinted Attention Card */}
      <Link
        to={hasActionable ? "/borrowing" : "/subscriptions"}
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:col-span-2 lg:col-span-1"
      >
        <Card
          className={cn(
            "h-full card-interactive cursor-pointer",
            hasActionable
              ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 hover:border-amber-400"
              : "bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground">
                  Perlu Tindakan
                </span>
                <p
                  className={cn(
                    "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums",
                    hasActionable
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {stats.actionableCount.toLocaleString("id-ID")}
                </p>
              </div>

              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  hasActionable
                    ? "bg-amber-700 text-white"
                    : "bg-emerald-700 text-white"
                )}
              >
                {hasActionable ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              {hasActionable ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {actionableChips.slice(0, 3).map((chip) => (
                    <Badge key={chip.label} variant={chip.variant}>
                      {chip.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="success">Semua terkendali</Badge>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <CreditCard className="h-3 w-3" />
                    {stats.activeSubscriptions} langganan aktif
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
