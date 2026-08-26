import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { 
  Package, 
  ArrowLeftRight, 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Check, 
  X,
  Loader2,
  RefreshCw,
  Layers,
  Inbox
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { fetchDashboardData, type DashboardData } from "@/lib/api/dashboard"
import { approveBorrowing, rejectBorrowing } from "@/lib/api/borrowings"
import { updateReminderStatus } from "@/lib/api/reminders"
import type { BorrowingItem } from "@/types/database"

export function Dashboard() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetchDashboardData()
      setData(res)
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApproveBorrow = async (borrowing: BorrowingItem) => {
    try {
      setActionLoadingId(borrowing.id)
      await approveBorrowing(borrowing.id, borrowing.inventory_id)
      await loadData()
    } catch (err) {
      console.error("Gagal menyetujui peminjaman:", err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectBorrow = async (borrowing: BorrowingItem) => {
    try {
      setActionLoadingId(borrowing.id)
      await rejectBorrowing(borrowing.id)
      await loadData()
    } catch (err) {
      console.error("Gagal menolak peminjaman:", err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCompleteReminder = async (id: string) => {
    try {
      await updateReminderStatus(id, "Completed")
      await loadData()
    } catch (err) {
      console.error("Gagal menyelesaikan pengingat:", err)
    }
  }

  const statsList = [
    {
      title: "Total Inventaris",
      value: data?.stats.totalInventories ?? 0,
      subtext: `${data?.stats.availableInventories ?? 0} unit tersedia di gudang`,
      change: `${data?.inventories.length ?? 0} kategori / aset`,
      trend: "up",
      icon: Package,
      accentColor: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    {
      title: "Peminjaman Aktif",
      value: data?.stats.activeBorrowings ?? 0,
      subtext: `${data?.stats.overdueBorrowings ?? 0} terlambat dikembalikan`,
      change: `${data?.stats.pendingBorrowings ?? 0} menunggu persetujuan`,
      trend: (data?.stats.overdueBorrowings ?? 0) > 0 ? "danger" : "alert",
      icon: ArrowLeftRight,
      accentColor: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
    {
      title: "Langganan Aktif",
      value: data?.stats.activeSubscriptions ?? 0,
      subtext: `Est. $${(data?.stats.monthlySubscriptionCost ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / bulan`,
      change: `${data?.subscriptions.length ?? 0} total terdaftar`,
      trend: "neutral",
      icon: CreditCard,
      accentColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    },
    {
      title: "Pengingat Perlu Tindakan",
      value: data?.stats.urgentRemindersCount ?? 0,
      subtext: "Belum terselesaikan",
      change: "Pantau tanggal jatuh tempo",
      trend: (data?.stats.urgentRemindersCount ?? 0) > 0 ? "alert" : "neutral",
      icon: Bell,
      accentColor: "bg-rose-500/10 text-rose-600 border-rose-200",
    },
  ]

  const recentBorrowings = data?.borrowings.slice(0, 5) || []
  const activeReminders = (data?.reminders.filter(r => r.status !== 'Completed') || []).slice(0, 5)
  const activeSubscriptions = (data?.subscriptions.filter(s => s.status === 'Active') || []).slice(0, 4)

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Ringkasan Operasional</h2>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            Pusat terpadu manajemen inventaris, sirkulasi peminjaman aset, lisensi software, dan pengingat otomatis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={isLoading}
            className="h-8 text-xs font-medium gap-1.5 border-border/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Link to="/inventory">
            <Button size="sm" variant="outline" className="h-8 text-xs font-medium gap-1.5 border-border/80">
              <Package className="h-3.5 w-3.5" />
              <span>Kelola Aset</span>
            </Button>
          </Link>
          <Link to="/borrowing">
            <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Alur Pinjam</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsList.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-4 border-border/80 hover:border-primary/40 transition-all duration-200 hover:shadow-xs group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground tracking-tight">{stat.title}</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
                  </div>
                </div>
                <div className={`p-2 rounded-lg border ${stat.accentColor} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">{stat.subtext}</span>
                <span className={`font-medium font-mono text-[10px] ${
                  stat.trend === 'alert' ? 'text-amber-600' :
                  stat.trend === 'danger' ? 'text-destructive' :
                  'text-primary'
                }`}>
                  {stat.change}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Grid: Left Table & Right Reminders Stream */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column (8 cols): Recent Borrowing & Asset Status */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/60">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  <span>Pelacakan Peminjaman Terkini</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Aset yang sedang dipinjam dan permohonan yang membutuhkan tindakan
                </CardDescription>
              </div>
              <Link to="/borrowing">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-primary hover:text-primary/90">
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <Table className="min-w-[620px] w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kode / Aset</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Peminjam</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tenggat Waktu</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-xs">Memuat data peminjaman...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : recentBorrowings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Inbox className="h-6 w-6 text-muted-foreground/60" />
                          <p className="text-xs">Belum ada aktivitas peminjaman.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentBorrowings.map((act) => {
                      const isItemBusy = actionLoadingId === act.id
                      return (
                        <TableRow key={act.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                          <TableCell className="py-2.5">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-xs text-foreground leading-none">{act.inventory?.name || "Aset"}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{act.inventory?.code || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-foreground">
                            {act.borrower?.full_name || "Staff"}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                            {formatDate(act.due_date)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge 
                              variant={
                                act.status === "Borrowed" ? "default" :
                                act.status === "Pending Approval" ? "secondary" : "outline"
                              }
                              className="text-[10px] font-mono px-2 py-0 h-5"
                            >
                              {act.status === "Pending Approval" ? "Menunggu" :
                               act.status === "Borrowed" ? "Dipinjam" :
                               act.status === "Returned" ? "Dikembalikan" : act.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            {act.status === "Pending Approval" && isAdmin ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  onClick={() => handleApproveBorrow(act)}
                                  disabled={isItemBusy}
                                  className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                                  title="Setujui"
                                >
                                  {isItemBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  onClick={() => handleRejectBorrow(act)}
                                  disabled={isItemBusy}
                                  className="h-6 w-6 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                  title="Tolak"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Link to="/borrowing">
                                <Button variant="ghost" size="sm" className="h-6 text-[11px] font-mono px-2 text-muted-foreground hover:text-foreground">
                                  Detail
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Quick Categories Bar */}
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Aset Fisik</p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {data?.stats.availableInventories ?? 0} / {data?.stats.totalInventories ?? 0} Unit Tersedia
                </p>
              </div>
            </Card>
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Sirkulasi Pinjam</p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {data?.stats.activeBorrowings ?? 0} Aset Dipinjam
                </p>
              </div>
            </Card>
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Lisensi & Cloud</p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {data?.stats.activeSubscriptions ?? 0} Layanan Aktif
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (4 cols): Action Reminders & Expiring Subscriptions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Reminders Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/60">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" />
                  <span>Pengingat Penting</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Notifikasi terpadu lintas modul
                </CardDescription>
              </div>
              <Badge variant="destructive" className="text-[10px] font-mono px-1.5 py-0 h-4">
                {activeReminders.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {isLoading ? (
                <div className="py-6 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                </div>
              ) : activeReminders.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Semua pengingat telah terselesaikan.
                </div>
              ) : (
                activeReminders.map((rem) => (
                  <div 
                    key={rem.id}
                    className="p-3 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-all duration-150"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight truncate">
                          {rem.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono px-1 py-0.2 rounded bg-muted border border-border/60 capitalize">
                            {rem.source_type}
                          </span>
                          <span className="font-medium flex items-center gap-1 text-foreground/80">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDate(rem.due_date)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleCompleteReminder(rem.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                        title="Tandai Selesai"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Link to="/reminders" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground border-dashed">
                  Kelola Semua Pengingat
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Subscription Watchlist */}
          <Card className="border-border/80 shadow-xs bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="p-4 pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Langganan Aktif Teratas</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Jadwal tagihan berikutnya
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                </div>
              ) : activeSubscriptions.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-xs">
                  Belum ada langganan terdaftar.
                </div>
              ) : (
                activeSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between pb-2 border-b border-border/50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-foreground">{sub.service_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Tagihan: {formatDate(sub.next_billing_date)}</p>
                    </div>
                    <span className="font-bold font-mono text-foreground">${Number(sub.cost).toFixed(2)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
