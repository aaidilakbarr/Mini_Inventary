import { Link } from "react-router-dom"
import { Package, ArrowLeftRight, AlertCircle, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { DashboardStats } from "@/lib/api/dashboard"

interface PrimaryMetricCardsProps {
  stats: DashboardStats
  onActionableClick?: () => void
}

export function PrimaryMetricCards({ stats }: PrimaryMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Total Inventaris */}
      <Link 
        to="/inventory" 
        className="group block rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Card className="h-full border border-slate-200/90 dark:border-border/80 bg-card rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/40 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Inventaris
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-sans">
                {stats.totalInventories.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {stats.availableInventories} tersedia
                </span>
                {stats.borrowedInventories > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    • {stats.borrowedInventories} dipinjam
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full shrink-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <Package className="h-5 w-5 stroke-[2]" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 mt-4" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Peminjaman Aktif */}
      <Link 
        to="/borrowing" 
        className="group block rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Card className="h-full border border-slate-200/90 dark:border-border/80 bg-card rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/40 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Peminjaman Aktif
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-sans">
                {stats.activeBorrowings.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                {stats.pendingBorrowings > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {stats.pendingBorrowings} menunggu persetujuan
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Semua permohonan telah ditinjau
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full shrink-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <ArrowLeftRight className="h-5 w-5 stroke-[2]" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 mt-4" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Perlu Tindakan */}
      <Link 
        to="/borrowing"
        className="group block rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 sm:col-span-2 lg:col-span-1"
      >
        <Card className={`h-full border bg-card rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer ${
          stats.actionableCount > 0 
            ? "border-amber-200 dark:border-amber-900/60 hover:border-amber-400" 
            : "border-slate-200/90 dark:border-border/80 hover:border-primary/40"
        }`}>
          <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Perlu Tindakan
                </span>
              </div>
              <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans ${
                stats.actionableCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              }`}>
                {stats.actionableCount.toLocaleString("id-ID")}
              </p>
              <div className="pt-0.5">
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {stats.actionableSummary}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full shrink-0">
              <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${
                stats.actionableCount > 0 
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400" 
                  : "bg-slate-500/10 border border-slate-500/20 text-slate-600"
              }`}>
                <AlertCircle className="h-5 w-5 stroke-[2]" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 mt-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
