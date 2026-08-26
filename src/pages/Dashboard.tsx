import { Link } from "react-router-dom"
import { 
  Package, 
  ArrowLeftRight, 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Laptop, 
  Monitor, 
  Key, 
  Check, 
  X 
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

export function Dashboard() {
  // Mock KPI Metrics
  const stats = [
    {
      title: "Total Inventaris",
      value: "2.450",
      subtext: "2.120 Tersedia di gudang",
      change: "+14 item baru",
      trend: "up",
      icon: Package,
      accentColor: "bg-blue-500/10 text-blue-600 border-blue-200",
      metricColor: "text-foreground",
    },
    {
      title: "Peminjaman Aktif",
      value: "142",
      subtext: "4 Terlambat dikembalikan",
      change: "3 menunggu persetujuan",
      trend: "alert",
      icon: ArrowLeftRight,
      accentColor: "bg-amber-500/10 text-amber-600 border-amber-200",
      metricColor: "text-foreground",
    },
    {
      title: "Langganan Aktif",
      value: "24",
      subtext: "Est. $3.450 / bulan",
      change: "2 perpanjangan dlm 7 hari",
      trend: "neutral",
      icon: CreditCard,
      accentColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      metricColor: "text-foreground",
    },
    {
      title: "Pengingat Perlu Tindakan",
      value: "5",
      subtext: "2 Jatuh tempo hari ini",
      change: "1 garansi berakhir",
      trend: "danger",
      icon: Bell,
      accentColor: "bg-rose-500/10 text-rose-600 border-rose-200",
      metricColor: "text-foreground",
    },
  ]

  // Recent Borrowing & Activity Stream
  const recentActivities = [
    {
      id: "BOR-1049",
      itemCode: "INV-MAC-042",
      itemName: "MacBook Pro M3 16\"",
      category: "Laptop",
      borrower: "Siti Rahma (Desain)",
      borrowDate: "2026-08-20",
      dueDate: "2026-08-28",
      status: "Dipinjam",
      statusVariant: "default",
    },
    {
      id: "BOR-1050",
      itemCode: "INV-MON-018",
      itemName: "Dell UltraSharp 27\" 4K",
      category: "Periferal",
      borrower: "Budi Santoso (Eng)",
      borrowDate: "2026-08-24",
      dueDate: "2026-09-07",
      status: "Menunggu Persetujuan",
      statusVariant: "secondary",
    },
    {
      id: "BOR-1045",
      itemCode: "INV-SRV-003",
      itemName: "Ubiquiti UniFi Switch 24P",
      category: "Jaringan",
      borrower: "Aidil (IT Ops)",
      borrowDate: "2026-08-10",
      dueDate: "2026-08-24",
      status: "Terlambat",
      statusVariant: "destructive",
    },
    {
      id: "BOR-1042",
      itemCode: "INV-CAM-005",
      itemName: "Sony Alpha A7 IV Kit",
      category: "Media",
      borrower: "Rian (Marketing)",
      borrowDate: "2026-08-15",
      dueDate: "2026-08-22",
      status: "Dikembalikan",
      statusVariant: "outline",
    },
  ]

  // Urgent Reminders
  const upcomingReminders = [
    {
      id: "REM-001",
      title: "Tagihan Bulanan AWS Cloud Infrastructure",
      module: "Langganan",
      dueDate: "Hari Ini, 18:00",
      priority: "high",
      cost: "$1.250,00",
      isUrgent: true,
    },
    {
      id: "REM-002",
      title: "Garansi Dell XPS 15 Berakhir",
      module: "Inventaris",
      dueDate: "Besok",
      priority: "medium",
      cost: "INV-XPS-009",
      isUrgent: false,
    },
    {
      id: "REM-003",
      title: "Pengembalian: Ubiquiti UniFi Switch",
      module: "Peminjaman",
      dueDate: "Terlambat 2 hari",
      priority: "high",
      cost: "Aidil Pratama",
      isUrgent: true,
    },
    {
      id: "REM-004",
      title: "Perpanjangan Google Workspace 50 Akun",
      module: "Langganan",
      dueDate: "dalam 5 hari",
      priority: "low",
      cost: "$360,00",
      isUrgent: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Ringkasan Operasional</h2>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
              Langsung Realtime
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            Pusat terpadu manajemen inventaris, sirkulasi peminjaman aset, lisensi software, dan pengingat otomatis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/inventory" className="flex-1 sm:flex-initial">
            <Button size="sm" variant="outline" className="w-full sm:w-auto h-8 text-xs font-medium gap-1.5 border-border/80">
              <Package className="h-3.5 w-3.5" />
              <span>Daftar Aset</span>
            </Button>
          </Link>
          <Link to="/borrowing" className="flex-1 sm:flex-initial">
            <Button size="sm" className="w-full sm:w-auto h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Alur Pinjam</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-4 border-border/80 hover:border-primary/40 transition-all duration-200 hover:shadow-xs group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground tracking-tight">{stat.title}</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {stat.value}
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
                  <span>Pelacakan Peminjaman & Aset</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Aset yang sedang dipinjam dan permohonan yang menunggu persetujuan
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
                  {recentActivities.map((act) => (
                    <TableRow key={act.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs text-foreground leading-none">{act.itemName}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{act.itemCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-foreground">
                        {act.borrower}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                        {act.dueDate}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge 
                          variant={
                            act.status === "Dipinjam" ? "default" :
                            act.status === "Menunggu Persetujuan" ? "secondary" :
                            act.status === "Terlambat" ? "destructive" : "outline"
                          }
                          className="text-[10px] font-mono px-2 py-0 h-5"
                        >
                          {act.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        {act.status === "Menunggu Persetujuan" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="outline" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300">
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-6 w-6 text-rose-600 hover:bg-rose-50 hover:border-rose-300">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] font-mono px-2 text-muted-foreground hover:text-foreground">
                            Detail
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Quick Categories Bar */}
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Laptop & Komputer</p>
                <p className="text-[11px] font-mono text-muted-foreground">84 / 92 Tersedia</p>
              </div>
            </Card>
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Monitor & Display</p>
                <p className="text-[11px] font-mono text-muted-foreground">42 / 50 Tersedia</p>
              </div>
            </Card>
            <Card className="p-3.5 border-border/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Key className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Lisensi Software</p>
                <p className="text-[11px] font-mono text-muted-foreground">24 SaaS Aktif</p>
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
                5 Total
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {upcomingReminders.map((rem) => (
                <div 
                  key={rem.id}
                  className={`p-3 rounded-lg border transition-all duration-150 ${
                    rem.isUrgent 
                      ? 'border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/50' 
                      : 'border-border/70 bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight truncate">
                        {rem.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-mono px-1 py-0.2 rounded bg-muted border border-border/60">
                          {rem.module}
                        </span>
                        <span className="font-medium flex items-center gap-1 text-foreground/80">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {rem.dueDate}
                        </span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                <span>Langganan Bulanan</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Jadwal perpanjangan berikutnya
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div>
                  <p className="font-semibold text-foreground">GitHub Enterprise</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Perpanjang: 01 Sep 2026</p>
                </div>
                <span className="font-bold font-mono text-foreground">$420.00 / bln</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div>
                  <p className="font-semibold text-foreground">Figma Organization</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Perpanjang: 05 Sep 2026</p>
                </div>
                <span className="font-bold font-mono text-foreground">$180.00 / bln</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Vercel Pro Team</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Perpanjang: 12 Sep 2026</p>
                </div>
                <span className="font-bold font-mono text-foreground">$60.00 / bln</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
