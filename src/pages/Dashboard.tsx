import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { fetchDashboardData, type DashboardData } from "@/lib/api/dashboard"
import { createInventory } from "@/lib/api/inventories"
import { recordAuditLog } from "@/lib/api/auditLogs"
import type { BorrowingItem, AuditLog, CreateInventoryPayload } from "@/types/database"

// Modular Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { PrimaryMetricCards } from "@/components/dashboard/PrimaryMetricCards"
import { OperationalSummaryBar } from "@/components/dashboard/OperationalSummaryBar"
import { InventoryConditionOverview } from "@/components/dashboard/InventoryConditionOverview"
import { RecentBorrowingCard } from "@/components/dashboard/RecentBorrowingCard"
import { UpcomingAgendaCard } from "@/components/dashboard/UpcomingAgendaCard"
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable"

// Modals
import { InventoryModal } from "@/components/modals/InventoryModal"
import { BorrowingDetailModal } from "@/components/modals/BorrowingDetailModal"
import { AuditDetailModal } from "@/components/modals/AuditDetailModal"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingItem | null>(null)
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)
      const res = await fetchDashboardData()
      setData(res)
    } catch (err) {
      console.error("Gagal memuat ringkasan dashboard:", err)
      setError("Gagal memuat data ringkasan sistem. Silakan periksa koneksi dan coba lagi.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handler for adding inventory from Dashboard summary bar
  const handleCreateInventory = async (payload: CreateInventoryPayload) => {
    try {
      const newItem = await createInventory(payload)
      await recordAuditLog({
        action: "CREATE_INVENTORY",
        entity_type: "inventory",
        entity_id: newItem.id,
        details: { name: newItem.name, code: newItem.code, quantity: newItem.quantity },
      })
      setIsInventoryModalOpen(false)
      // Refresh dashboard data
      loadData(true)
    } catch (err) {
      console.error("Gagal menambahkan inventaris:", err)
      throw err
    }
  }

  // Export operational report CSV
  const handleExportOperationalCSV = () => {
    if (!data) return
    const s = data.stats
    const rows = [
      ["Laporan Ringkasan Operasional Stockly / INV.HUB"],
      [`Tanggal Ekspor: ${new Date().toLocaleString("id-ID")}`],
      [""],
      ["METRIK UTAMA", "JUMLAH"],
      ["Total Inventaris Fisik", s.totalInventories],
      ["Inventaris Tersedia", s.availableInventories],
      ["Inventaris Dipinjam", s.borrowedInventories],
      ["Inventaris Pemeliharaan", s.maintenanceInventories],
      ["Inventaris Rusak/Hilang", s.damagedInventories],
      ["Inventaris Stok Menipis", s.lowStockInventories],
      ["Peminjaman Aktif", s.activeBorrowings],
      ["Peminjaman Menunggu Persetujuan", s.pendingBorrowings],
      ["Peminjaman Terlambat", s.overdueBorrowings],
      ["Total Tindakan Diperlukan", s.actionableCount],
      ["Langganan Aktif", s.activeSubscriptions],
      ["Estimasi Beban Langganan Bulanan", `IDR ${Math.round(s.monthlySubscriptionCost).toLocaleString("id-ID")}`],
      ["Agenda Pengingat Aktif", s.urgentRemindersCount],
    ]

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Stockly_Ringkasan_Operasional_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Loading skeleton matching target design structure
  if (isLoading && !data) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-muted rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-slate-200 dark:bg-muted rounded-lg" />
        </div>

        {/* 3 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="h-32 bg-slate-200 dark:bg-muted rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-muted rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-muted rounded-2xl sm:col-span-2 lg:col-span-1" />
        </div>

        {/* Operational Bar Skeleton */}
        <div className="h-16 bg-slate-200 dark:bg-muted rounded-2xl" />

        {/* 6 / 3 / 3 Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-6 h-80 bg-slate-200 dark:bg-muted rounded-2xl" />
          <div className="lg:col-span-3 h-80 bg-slate-200 dark:bg-muted rounded-2xl" />
          <div className="lg:col-span-3 h-80 bg-slate-200 dark:bg-muted rounded-2xl" />
        </div>

        {/* Table Skeleton */}
        <div className="h-64 bg-slate-200 dark:bg-muted rounded-2xl" />
      </div>
    )
  }

  // Error State with retry
  if (error && !data) {
    return (
      <div className="p-8 max-w-md mx-auto my-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Kendala Koneksi Data</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => loadData()} className="rounded-xl h-9 text-xs gap-1.5 cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Muat Ulang</span>
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header */}
      <DashboardHeader
        userName={profile?.full_name || undefined}
        isAdmin={isAdmin}
      />

      {/* 2. Primary KPI Cards (3 Cards) */}
      <PrimaryMetricCards stats={data.stats} />

      {/* 3. Operational Summary Bar */}
      <OperationalSummaryBar
        lastUpdated={data.lastUpdated}
        actionableCount={data.stats.actionableCount}
        actionableSummary={data.stats.actionableSummary}
        isLoading={isRefreshing}
        onRefresh={() => loadData(true)}
        onExport={handleExportOperationalCSV}
        onAddInventory={() => setIsInventoryModalOpen(true)}
        canAddInventory={isAdmin}
      />

      {/* 4. Main Analytical Grid (12 Columns: 6 / 3 / 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* A. Distribusi Kondisi Inventaris (6 columns) */}
        <div className="lg:col-span-6 flex flex-col">
          <InventoryConditionOverview
            inventories={data.inventories}
            categories={data.categories}
          />
        </div>

        {/* B. Peminjaman Terkini (3 columns) */}
        <div className="lg:col-span-3 flex flex-col">
          <RecentBorrowingCard
            borrowings={data.borrowings}
            onViewDetail={(item) => setSelectedBorrowing(item)}
            isAdmin={isAdmin}
          />
        </div>

        {/* C. Agenda & Pengingat (3 columns) */}
        <div className="lg:col-span-3 flex flex-col">
          <UpcomingAgendaCard agenda={data.upcomingAgenda} />
        </div>
      </div>

      {/* 5. Recent Activity Table */}
      <RecentActivityTable
        logs={data.recentActivity}
        onViewDetail={(log) => setSelectedAuditLog(log)}
      />

      {/* Modals Integration */}
      {isAdmin && (
        <InventoryModal
          open={isInventoryModalOpen}
          onOpenChange={setIsInventoryModalOpen}
          categories={data.categories}
          onSubmit={handleCreateInventory}
        />
      )}

      <BorrowingDetailModal
        isOpen={Boolean(selectedBorrowing)}
        onClose={() => setSelectedBorrowing(null)}
        item={selectedBorrowing}
      />

      <AuditDetailModal
        isOpen={Boolean(selectedAuditLog)}
        onClose={() => setSelectedAuditLog(null)}
        log={selectedAuditLog}
      />
    </div>
  )
}
