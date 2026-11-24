import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, Layers } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InventoryItem, Category } from "@/types/database"

interface InventoryConditionOverviewProps {
  inventories: InventoryItem[]
  categories: Category[]
}

const CONDITION_LABELS: Record<string, string> = {
  all: "Semua Status",
  available: "Tersedia",
  borrowed: "Dipinjam",
  maintenance: "Perawatan",
  damaged: "Rusak / Hilang",
}

export function InventoryConditionOverview({
  inventories,
  categories,
}: InventoryConditionOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<string>("all")

  const filteredInventories = useMemo(() => {
    return inventories.filter((item) => {
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

  const stats = useMemo(() => {
    const total = filteredInventories.reduce((acc, i) => acc + (i.quantity || 1), 0)
    const available = filteredInventories
      .filter((i) => i.status === "Available")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const borrowed = filteredInventories
      .filter((i) => i.status === "Borrowed")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const maintenance = filteredInventories
      .filter((i) => i.status === "Maintenance")
      .reduce((acc, i) => acc + (i.quantity || 1), 0)
    const damaged = filteredInventories
      .filter((i) => {
        const cond = (i.condition || "").toLowerCase()
        return i.status === "Lost" || i.status === "Retired" || cond.includes("rusak")
      })
      .reduce((acc, i) => acc + (i.quantity || 1), 0)

    const lowStock = filteredInventories.filter(
      (i) => (i.quantity || 0) <= 2 && i.status === "Available"
    ).length

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

  // Real category distribution computed from active filtered inventory
  const topCategories = useMemo(() => {
    const counts = new Map<string, { name: string; units: number }>()
    filteredInventories.forEach((item) => {
      const id = item.category_id || "uncategorized"
      const name =
        item.category?.name ||
        categories.find((c) => c.id === item.category_id)?.name ||
        "Umum"
      const prev = counts.get(id)
      counts.set(id, { name, units: (prev?.units || 0) + (item.quantity || 1) })
    })
    return Array.from(counts.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 4)
  }, [filteredInventories, categories])

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Semua Kategori"
      : categories.find((c) => c.id === selectedCategory)?.name || "Kategori"

  const tiles = [
    { label: "Tersedia", count: stats.available, pct: stats.availablePct, dot: "bg-emerald-600" },
    { label: "Dipinjam", count: stats.borrowed, pct: stats.borrowedPct, dot: "bg-primary" },
    { label: "Perawatan", count: stats.maintenance, pct: stats.maintenancePct, dot: "bg-amber-600" },
    { label: "Rusak / Hilang", count: stats.damaged, pct: stats.damagedPct, dot: "bg-destructive" },
  ]

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Kondisi Inventaris</CardTitle>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Katalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={selectedCategory}
              onValueChange={(val) => setSelectedCategory(val || "all")}
            >
              <SelectTrigger className="h-10 sm:h-8" aria-label="Filter kategori">
                <SelectValue>{selectedCategoryName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedConditionFilter}
              onValueChange={(val) => setSelectedConditionFilter(val || "all")}
            >
              <SelectTrigger className="h-10 sm:h-8" aria-label="Filter status kondisi">
                <SelectValue>{CONDITION_LABELS[selectedConditionFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="borrowed">Dipinjam</SelectItem>
                <SelectItem value="maintenance">Perawatan</SelectItem>
                <SelectItem value="damaged">Rusak / Hilang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Segmented Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-foreground tabular-nums">
                {stats.total.toLocaleString("id-ID")} unit
              </span>
              <Badge variant="success">{stats.availablePct}% tersedia</Badge>
            </div>

            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
              {stats.available > 0 && (
                <div
                  style={{ width: `${Math.max(stats.availablePct, 3)}%` }}
                  className="h-full bg-emerald-600 animate-bar"
                  title={`Tersedia: ${stats.available} (${stats.availablePct}%)`}
                />
              )}
              {stats.borrowed > 0 && (
                <div
                  style={{ width: `${Math.max(stats.borrowedPct, 3)}%` }}
                  className="h-full bg-primary animate-bar"
                  title={`Dipinjam: ${stats.borrowed} (${stats.borrowedPct}%)`}
                />
              )}
              {stats.maintenance > 0 && (
                <div
                  style={{ width: `${Math.max(stats.maintenancePct, 3)}%` }}
                  className="h-full bg-amber-600 animate-bar"
                  title={`Perawatan: ${stats.maintenance} (${stats.maintenancePct}%)`}
                />
              )}
              {stats.damaged > 0 && (
                <div
                  style={{ width: `${Math.max(stats.damagedPct, 3)}%` }}
                  className="h-full bg-destructive animate-bar"
                  title={`Rusak / Hilang: ${stats.damaged} (${stats.damagedPct}%)`}
                />
              )}
            </div>
          </div>

          {/* 4 Condition Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="p-2.5 sm:p-3 rounded-lg border border-border bg-muted/30 space-y-1 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${tile.dot}`} />
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    {tile.label}
                  </span>
                </div>
                <p className="text-base font-bold text-foreground tabular-nums">
                  {tile.count}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {tile.pct}%
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Real Category Breakdown: Gives 6-col analytical card balanced density */}
          {topCategories.length > 0 && (
            <div className="pt-3 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Sebaran Kategori
                </span>
                <span className="font-mono">{topCategories.length} teratas</span>
              </div>

              <div className="space-y-2">
                {topCategories.map((cat) => {
                  const pct = stats.total > 0 ? Math.round((cat.units / stats.total) * 100) : 0
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate pr-2">{cat.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
                          <strong className="text-foreground">{cat.units}</strong> unit ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/80 animate-bar"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {stats.lowStock > 0 && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <Alert variant="warning" className="items-center justify-between py-2">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-semibold">
                {stats.lowStock} aset stok menipis
              </span>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-bold underline underline-offset-2 shrink-0"
            >
              Cek
            </Link>
          </Alert>
        </div>
      )}
    </Card>
  )
}
