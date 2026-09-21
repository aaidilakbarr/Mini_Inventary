import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { PieChart, ArrowRight, AlertTriangle, CheckCircle2, RefreshCcw, Wrench, ShieldAlert } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { InventoryItem, Category } from "@/types/database"

interface InventoryConditionOverviewProps {
  inventories: InventoryItem[]
  categories: Category[]
}

export function InventoryConditionOverview({ inventories, categories }: InventoryConditionOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<string>("all")

  // Filter inventories based on interactive filter controls
  const filteredInventories = useMemo(() => {
    return inventories.filter(item => {
      const matchCat = selectedCategory === "all" || item.category_id === selectedCategory
      if (!matchCat) return false

      if (selectedConditionFilter === "all") return true
      if (selectedConditionFilter === "available") return item.status === "Available"
      if (selectedConditionFilter === "borrowed") return item.status === "Borrowed"
      if (selectedConditionFilter === "maintenance") return item.status === "Maintenance"
      if (selectedConditionFilter === "damaged") {
        const cond = (item.condition || "").toLowerCase()
        return item.status === "Lost" || item.status === "Retired" || cond.includes("rusak")
      }
      return true
    })
  }, [inventories, selectedCategory, selectedConditionFilter])

  // Aggregate condition statistics from the active filtered subset
  const stats = useMemo(() => {
    const total = filteredInventories.reduce((acc, i) => acc + (i.quantity || 1), 0)
    const available = filteredInventories
      .filter(i => i.status === "Available")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const borrowed = filteredInventories
      .filter(i => i.status === "Borrowed")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const maintenance = filteredInventories
      .filter(i => i.status === "Maintenance")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const damaged = filteredInventories
      .filter(i => {
        const cond = (i.condition || "").toLowerCase()
        return i.status === "Lost" || i.status === "Retired" || cond.includes("rusak")
      })
      .reduce((acc, i) => acc + (i.quantity || 1), 0)

    const lowStock = filteredInventories.filter(i => (i.quantity || 0) <= 2 && i.status === "Available").length

    const calcPct = (num: number) => (total > 0 ? Math.round((num / total) * 100) : 0)

    return {
      total,
      available,
      availablePct: calcPct(available),
      borrowed,
      borrowedPct: calcPct(borrowed),
      maintenance,
      maintenancePct: calcPct(maintenance),
      damaged,
      damagedPct: calcPct(damaged),
      lowStock,
    }
  }, [filteredInventories])

  return (
    <Card className="h-full border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card rounded-2xl shadow-xs flex flex-col justify-between">
      <div>
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <PieChart className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Distribusi Kondisi Inventaris
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Ringkasan kondisi dan alokasi unit fisik aset secara transparan
              </CardDescription>
            </div>

            <Link to="/inventory">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2.5 text-xs text-primary hover:bg-primary/5 gap-1 font-semibold cursor-pointer"
              >
                <span>Katalog</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {/* Interactive Filters Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-border/50 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-7 px-2 text-xs rounded-lg bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border text-foreground font-medium focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">Semua Kategori ({inventories.length} item)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-medium text-muted-foreground">Kondisi:</span>
              <select
                value={selectedConditionFilter}
                onChange={(e) => setSelectedConditionFilter(e.target.value)}
                className="h-7 px-2 text-xs rounded-lg bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border text-foreground font-medium focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="available">Hanya Tersedia</option>
                <option value="borrowed">Sedang Dipinjam</option>
                <option value="maintenance">Dalam Pemeliharaan</option>
                <option value="damaged">Rusak / Tidak Layak</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-1 space-y-4">
          {/* Segmented Distribution Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">
                Total Aset Terpantau: <span className="font-mono text-primary">{stats.total} unit</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {stats.availablePct}% Layak Pakai
              </span>
            </div>

            <div className="h-3.5 w-full bg-slate-100 dark:bg-muted rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/80 dark:border-border/60">
              {stats.available > 0 && (
                <div
                  style={{ width: `${Math.max(stats.availablePct, 4)}%` }}
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                  title={`Tersedia: ${stats.available} unit (${stats.availablePct}%)`}
                />
              )}
              {stats.borrowed > 0 && (
                <div
                  style={{ width: `${Math.max(stats.borrowedPct, 4)}%` }}
                  className="h-full bg-blue-500 transition-all duration-300"
                  title={`Dipinjam: ${stats.borrowed} unit (${stats.borrowedPct}%)`}
                />
              )}
              {stats.maintenance > 0 && (
                <div
                  style={{ width: `${Math.max(stats.maintenancePct, 4)}%` }}
                  className="h-full bg-violet-500 transition-all duration-300"
                  title={`Pemeliharaan: ${stats.maintenance} unit (${stats.maintenancePct}%)`}
                />
              )}
              {stats.damaged > 0 && (
                <div
                  style={{ width: `${Math.max(stats.damagedPct, 4)}%` }}
                  className="h-full bg-rose-500 rounded-r-full transition-all duration-300"
                  title={`Rusak / Hilang: ${stats.damaged} unit (${stats.damagedPct}%)`}
                />
              )}
            </div>
          </div>

          {/* 4 Condition Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Tersedia */}
            <div className="p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Tersedia</span>
              </div>
              <p className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {stats.available} <span className="text-[10px] font-sans font-medium text-emerald-700 dark:text-emerald-400">({stats.availablePct}%)</span>
              </p>
            </div>

            {/* Dipinjam */}
            <div className="p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <RefreshCcw className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Dipinjam</span>
              </div>
              <p className="text-lg font-bold font-mono text-blue-900 dark:text-blue-200">
                {stats.borrowed} <span className="text-[10px] font-sans font-medium text-blue-700 dark:text-blue-400">({stats.borrowedPct}%)</span>
              </p>
            </div>

            {/* Pemeliharaan */}
            <div className="p-3 rounded-xl border border-violet-200/80 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/20 space-y-1">
              <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
                <Wrench className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Pemeliharaan</span>
              </div>
              <p className="text-lg font-bold font-mono text-violet-900 dark:text-violet-200">
                {stats.maintenance} <span className="text-[10px] font-sans font-medium text-violet-700 dark:text-violet-400">({stats.maintenancePct}%)</span>
              </p>
            </div>

            {/* Rusak / Hilang */}
            <div className="p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Rusak / Hilang</span>
              </div>
              <p className="text-lg font-bold font-mono text-rose-900 dark:text-rose-200">
                {stats.damaged} <span className="text-[10px] font-sans font-medium text-rose-700 dark:text-rose-400">({stats.damagedPct}%)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Low Stock Warning Banner if detected */}
      {stats.lowStock > 0 && (
        <div className="mx-4 sm:mx-5 mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>{stats.lowStock} aset</strong> memiliki sisa kuantitas kritis (≤ 2 unit).
            </span>
          </div>
          <Link to="/inventory">
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-lg border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0 font-medium">
              Cek Stok
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
