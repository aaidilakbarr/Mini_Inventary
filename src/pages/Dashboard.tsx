import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { fetchDashboardData, type DashboardData } from "@/lib/api/dashboard"
import { createInventory } from "@/lib/api/inventories"
import { recordAuditLog } from "@/lib/api/auditLogs"
import type { BorrowingItem, AuditLog, CreateInventoryPayload } from "@/types/database"

import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { PrimaryMetricCards } from "@/components/dashboard/PrimaryMetricCards"
import { OperationalSummaryBar } from "@/components/dashboard/OperationalSummaryBar"
import { InventoryConditionOverview } from "@/components/dashboard/InventoryConditionOverview"
import { RecentBorrowingCard } from "@/components/dashboard/RecentBorrowingCard"
import { UpcomingAgendaCard } from "@/components/dashboard/UpcomingAgendaCard"
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable"

import { InventoryModal } from "@/components/modals/InventoryModal"
import { BorrowingDetailModal } from "@/components/modals/BorrowingDetailModal"
import { AuditDetailModal } from "@/components/modals/AuditDetailModal"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError("Gagal memuat data dashboard. Periksa koneksi lalu coba lagi.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateInventory = async (payload: CreateInventoryPayload) => {
    const newItem = await createInventory(payload)
    await recordAuditLog({
      action: "CREATE_INVENTORY",
      entity_type: "inventory",
      entity_id: newItem.id,
      details: { name: newItem.name, code: newItem.code, quantity: newItem.quantity },
    })
    setIsInventoryModalOpen(false)
    loadData(true)
  }

  const handleExportOperationalCSV = () => {
    if (!data) return
    const s = data.stats
    const rows = [
      ["Laporan Ringkasan Operasional Stockly"],
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
      ["Agenda Aktif", s.urgentRemindersCount],
    ]

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Stockly_Operasional_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl sm:col-span-2 lg:col-span-1" />
        </div>
        <Skeleton className="h-14 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-6 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
        </div>
        <Skeleton className="h-60 rounded-xl" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-md mx-auto my-12 space-y-4">
        <Alert variant="destructive" className="p-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <AlertTitle>Gagal Memuat Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button size="sm" variant="outline" onClick={() => loadData()} className="mt-1">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Coba Lagi</span>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-enter">
        <DashboardHeader userName={profile?.full_name || undefined} isAdmin={isAdmin} />
      </div>

      <div className="animate-enter stagger-1">
        <PrimaryMetricCards stats={data.stats} />
      </div>

      <div className="animate-enter stagger-2">
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
      </div>

      {/* Main Analytical Grid: Reflows to mobile priority order (Borrowing -> Agenda -> Condition) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-enter stagger-3">
        <div className="order-3 lg:order-1 lg:col-span-6 flex flex-col">
          <InventoryConditionOverview inventories={data.inventories} categories={data.categories} />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-3 flex flex-col">
          <RecentBorrowingCard
            borrowings={data.borrowings}
            onViewDetail={(item) => setSelectedBorrowing(item)}
            isAdmin={isAdmin}
          />
        </div>
        <div className="order-2 lg:order-3 lg:col-span-3 flex flex-col">
          <UpcomingAgendaCard agenda={data.upcomingAgenda} />
        </div>
      </div>

      <div className="animate-enter stagger-4">
        <RecentActivityTable logs={data.recentActivity} onViewDetail={(log) => setSelectedAuditLog(log)} />
      </div>

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
