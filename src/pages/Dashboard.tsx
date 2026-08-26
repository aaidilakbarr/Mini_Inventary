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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Selamat Datang, {profile?.full_name || "Pengguna"}!
          </h1>
          <p className="text-xs text-muted-foreground">
            Ringkasan pemantauan inventaris aset fisik, lisensi layanan, dan jadwal operasional perusahaan.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {isAdmin && (
            <Badge variant="outline" className="h-8 px-2.5 text-xs font-mono gap-1 text-primary border-primary/30 bg-primary/5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Mode</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Alert Banners if any urgent issues */}
      {(overdueCount > 0 || (isAdmin && pendingCount > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{overdueCount} Peminjaman Terlambat!</strong> Segera tindak lanjuti pengembalian aset.
                </span>
              </div>
              <Link to="/borrowing">
                <Button size="sm" variant="destructive" className="h-6 text-[11px] px-2.5">
                  Lihat
                </Button>
              </Link>
            </div>
          )}

          {isAdmin && pendingCount > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{pendingCount} Permohonan Menunggu Persetujuan.</strong>
                </span>
              </div>
              <Link to="/borrowing">
                <Button size="sm" variant="outline" className="h-6 text-[11px] px-2.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                  Tinjau
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Aset Fisik</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.totalInventories || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                <span className="text-emerald-600 font-semibold">{stats?.availableInventories || 0} Tersedia</span> untuk dipinjam
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Peminjaman Aktif</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.activeBorrowings || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                <span className="text-amber-600 font-semibold">{pendingCount} Menunggu</span> persetujuan
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <HandHelping className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Beban Langganan/Bln</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5 truncate max-w-[130px]">
                {formatCurrencyID(stats?.monthlySubscriptionCost || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stats?.activeSubscriptions || 0} Langganan aktif
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Agenda Pengingat</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats?.urgentRemindersCount || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Jadwal aktif & operasional
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <BellRing className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Sections: Recent Borrowings & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Borrowings */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Log Peminjaman Terkini</CardTitle>
              <CardDescription className="text-xs">Aktivitas peminjaman dan permohonan aset terbaru</CardDescription>
            </div>
            <Link to="/borrowing">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
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
                  <div key={b.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{b.inventory?.name || "Aset"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Oleh <span className="font-medium text-foreground">{b.borrower?.full_name || "User"}</span> • {formatDateID(b.request_date)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        b.status === "Borrowed" ? "default" :
                        b.status === "Pending Approval" ? "secondary" :
                        b.status === "Returned" ? "outline" : "destructive"
                      }
                      className="text-[10px] font-mono px-2 shrink-0"
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
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Agenda & Pengingat Mendatang</CardTitle>
              <CardDescription className="text-xs">Jadwal pemeliharaan dan batas waktu terdekat</CardDescription>
            </div>
            <Link to="/reminders">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
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
                  <div key={r.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Jatuh tempo: <span className="font-mono">{formatDateID(r.due_date)}</span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        r.priority === "Tinggi" ? "destructive" :
                        r.priority === "Sedang" ? "secondary" : "outline"
                      }
                      className="text-[10px] font-mono px-2 shrink-0"
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
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Langganan Software & Lisensi</CardTitle>
            <CardDescription className="text-xs">Daftar biaya lisensi aktif dan tanggal perpanjangan berikutnya</CardDescription>
          </div>
          <Link to="/subscriptions">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
              <span>Kelola Langganan</span>
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
                <div key={sub.id} className="p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground truncate">{sub.service_name}</p>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {sub.billing_cycle}
                    </Badge>
                  </div>
                  <p className="text-base font-bold font-mono text-primary">
                    {formatCurrencyID(sub.cost)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Tagihan berikutnya: <span className="font-mono text-foreground">{formatDateID(sub.next_billing_date)}</span>
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
