import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  Boxes,
  HandHelping,
  CreditCard,
  BellRing,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
  ShieldCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchDashboardData, type DashboardData } from "@/lib/api/dashboard"
import { formatDateID, formatCurrencyID } from "@/lib/formatters"

export function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetchDashboardData()
      setData(res)
    } catch (err) {
      console.error("Gagal memuat ringkasan dashboard:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Memuat data ringkasan sistem...</p>
      </div>
    )
  }

  const stats = data?.stats
  const overdueCount = stats?.overdueBorrowings || 0
  const pendingCount = stats?.pendingBorrowings || 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Selamat Datang, {profile?.full_name || "Pengguna"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Ringkasan pemantauan inventaris aset fisik, lisensi layanan, dan jadwal operasional perusahaan.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-8 sm:h-9 px-3 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs flex-1 sm:flex-none justify-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          {isAdmin && (
            <Badge variant="outline" className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-mono gap-1.5 text-primary border-primary/30 bg-primary/5 rounded-xl inline-flex items-center shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Mode</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Alert Banners if any urgent issues */}
      {(overdueCount > 0 || (isAdmin && pendingCount > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  <strong>{overdueCount} Peminjaman Terlambat!</strong> Segera tindak lanjuti pengembalian.
                </span>
              </div>
              <Link to="/borrowing" className="shrink-0">
                <Button size="sm" variant="destructive" className="h-6.5 text-[11px] px-2.5 rounded-lg shadow-2xs font-medium">
                  Lihat
                </Button>
              </Link>
            </div>
          )}

          {isAdmin && pendingCount > 0 && (
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  <strong>{pendingCount} Permohonan</strong> menunggu persetujuan.
                </span>
              </div>
              <Link to="/borrowing" className="shrink-0">
                <Button size="sm" variant="outline" className="h-6.5 text-[11px] px-2.5 rounded-lg border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-medium">
                  Tinjau
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards Grid - 2 cols on mobile for compact viewing, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">Total Aset Fisik</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.totalInventories || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.availableInventories || 0}</span> Tersedia
              </p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Boxes className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">Peminjaman Aktif</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.activeBorrowings || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{pendingCount}</span> Menunggu
              </p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <HandHelping className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">Beban Langganan</p>
              <p className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 truncate">
                {formatCurrencyID(stats?.monthlySubscriptionCost || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {stats?.activeSubscriptions || 0} Aktif
              </p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">Agenda Pengingat</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.urgentRemindersCount || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                Jadwal aktif
              </p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <BellRing className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Sections: Recent Borrowings & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Borrowings */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-xs sm:text-sm font-bold truncate">Log Peminjaman Terkini</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs truncate">Aktivitas peminjaman dan permohonan aset terbaru</CardDescription>
            </div>
            <Link to="/borrowing" className="shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/5">
                <span>Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/60">
            {(!data?.borrowings || data.borrowings.length === 0) ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Belum ada aktivitas peminjaman tercatat.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.borrowings.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-3 sm:px-4 flex items-center justify-between gap-2.5 text-xs hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{b.inventory?.name || "Aset"}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Oleh <span className="font-medium text-foreground">{b.borrower?.full_name || "User"}</span> • {formatDateID(b.request_date)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        b.status === "Borrowed" ? "default" :
                        b.status === "Pending Approval" ? "secondary" :
                        b.status === "Returned" ? "outline" : "destructive"
                      }
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                    >
                      {b.status === "Pending Approval" ? "Menunggu" :
                       b.status === "Borrowed" ? "Dipinjam" :
                       b.status === "Returned" ? "Kembali" : b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reminders & Schedules */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-xs sm:text-sm font-bold truncate">Agenda & Pengingat Mendatang</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs truncate">Jadwal pemeliharaan dan batas waktu terdekat</CardDescription>
            </div>
            <Link to="/reminders" className="shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/5">
                <span>Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 border-t border-border/60">
            {(!data?.reminders || data.reminders.length === 0) ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Tidak ada agenda pengingat aktif saat ini.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.reminders.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-3 sm:px-4 flex items-center justify-between gap-2.5 text-xs hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{r.title}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Jatuh tempo: <span className="font-mono">{formatDateID(r.due_date)}</span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        r.priority === "Tinggi" ? "destructive" :
                        r.priority === "Sedang" ? "secondary" : "outline"
                      }
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                    >
                      {r.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Subscription Overview */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-3.5 sm:p-4 pb-2.5 sm:pb-3 flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-xs sm:text-sm font-bold truncate">Langganan Software & Lisensi</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs truncate">Daftar biaya lisensi aktif dan tanggal perpanjangan</CardDescription>
          </div>
          <Link to="/subscriptions" className="shrink-0">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/5">
              <span>Semua</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 border-t border-border/60">
          {(!data?.subscriptions || data.subscriptions.length === 0) ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Belum ada data langganan terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              {data.subscriptions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="p-3.5 sm:p-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">{sub.service_name}</p>
                    <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 rounded-full shrink-0">
                      {sub.billing_cycle}
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base font-bold font-mono text-primary truncate">
                    {formatCurrencyID(sub.cost)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    Tagihan: <span className="font-mono text-foreground">{formatDateID(sub.next_billing_date)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
