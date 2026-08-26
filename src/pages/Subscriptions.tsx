import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

const mockSubscriptions = [
  {
    id: "SUB-01",
    serviceName: "AWS Cloud Infrastructure",
    provider: "Amazon Web Services",
    category: "Cloud Hosting",
    cost: 1250.00,
    cycle: "Bulanan",
    nextBillingDate: "01 Sep 2026",
    paymentMethod: "Visa Korporat (..4242)",
    status: "Aktif",
  },
  {
    id: "SUB-02",
    serviceName: "GitHub Enterprise Cloud",
    provider: "GitHub / Microsoft",
    category: "Developer Tools",
    cost: 420.00,
    cycle: "Bulanan",
    nextBillingDate: "01 Sep 2026",
    paymentMethod: "Mastercard Korporat",
    status: "Aktif",
  },
  {
    id: "SUB-03",
    serviceName: "Google Workspace (50 Akun)",
    provider: "Google LLC",
    category: "Produktivitas",
    cost: 360.00,
    cycle: "Bulanan",
    nextBillingDate: "31 Agu 2026",
    paymentMethod: "Debit Rekening Bank",
    status: "Aktif",
  },
  {
    id: "SUB-04",
    serviceName: "Figma Organization Plan",
    provider: "Figma Inc.",
    category: "Software Desain",
    cost: 180.00,
    cycle: "Bulanan",
    nextBillingDate: "05 Sep 2026",
    paymentMethod: "Visa Korporat (..4242)",
    status: "Aktif",
  },
  {
    id: "SUB-05",
    serviceName: "Cloudflare Pro Domain DNS",
    provider: "Cloudflare",
    category: "Jaringan",
    cost: 240.00,
    cycle: "Tahunan",
    nextBillingDate: "15 Jan 2027",
    paymentMethod: "PayPal Korporat",
    status: "Aktif",
  },
]

export function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    return (
      sub.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const totalMonthlySpend = mockSubscriptions.reduce((acc, curr) => {
    return curr.cycle === "Bulanan" ? acc + curr.cost : acc + (curr.cost / 12)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Langganan & Lisensi</h1>
          <p className="text-xs text-muted-foreground">
            Kelola langganan SaaS rutin, biaya infrastruktur cloud, dan pengingat tanggal perpanjangan.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Langganan</span>
        </Button>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 border-border/80 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Total Pengeluaran Bulanan</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">
            ${totalMonthlySpend.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Dari 5 layanan aktif</p>
        </Card>
        <Card className="p-4 border-border/80 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Perpanjangan Mendatang (7 Hari)</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">3 Layanan</p>
          <p className="text-[10px] text-muted-foreground mt-1">Estimasi biaya: $2.030,00</p>
        </Card>
        <Card className="p-4 border-border/80 shadow-xs sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Akun Pembayaran Utama</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">Visa Korporat</p>
          <p className="text-[10px] text-muted-foreground mt-1">Berakhir di ..4242</p>
        </Card>
      </div>

      {/* Search Bar Filter */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari layanan, penyedia, kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Layanan / Penyedia</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kategori</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Siklus Tagihan</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Biaya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tgl Tagihan Berikutnya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Metode Pembayaran</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="py-3">
                    <p className="font-semibold text-xs text-foreground">{sub.serviceName}</p>
                    <p className="text-[10px] text-muted-foreground">{sub.provider}</p>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-border/80">
                      {sub.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                    {sub.cycle}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono font-bold text-foreground">
                    ${sub.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-primary font-medium">
                    {sub.nextBillingDate}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {sub.paymentMethod}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="default" className="text-[10px] font-mono px-2 py-0 h-5 bg-emerald-600 hover:bg-emerald-700">
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
