import { useState } from "react"
import { 
  Plus, 
  Check 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

const mockReminders = [
  {
    id: "REM-01",
    title: "Tagihan Bulanan AWS Cloud Infrastructure",
    description: "Biaya rutin terjadwal untuk klaster ECS & basis data RDS produksi",
    sourceType: "Langganan",
    dueDate: "26 Agu 2026 (Hari Ini)",
    status: "Hari Ini",
    priority: "Tinggi",
  },
  {
    id: "REM-02",
    title: "Tenggat Pengembalian: Ubiquiti UniFi Switch (Aidil)",
    description: "Batas pengembalian aset BOR-1045 telah terlewati 2 hari",
    sourceType: "Peminjaman",
    dueDate: "24 Agu 2026 (Terlambat)",
    status: "Terlambat",
    priority: "Tinggi",
  },
  {
    id: "REM-03",
    title: "Masa Garansi Dell XPS 15 Berakhir",
    description: "Cakupan garansi resmi berakhir untuk aset INV-XPS-009",
    sourceType: "Inventaris",
    dueDate: "27 Agu 2026",
    status: "Mendatang",
    priority: "Sedang",
  },
  {
    id: "REM-04",
    title: "Perpanjangan Lisensi Google Workspace 50 Akun",
    description: "Perpanjangan debit otomatis lisensi produktivitas tahunan",
    sourceType: "Langganan",
    dueDate: "31 Agu 2026",
    status: "Mendatang",
    priority: "Rendah",
  },
  {
    id: "REM-05",
    title: "Perawatan Rutin Baterai UPS Ruang Server",
    description: "Pengecekan berkala semesteran oleh tim teknisi vendor",
    sourceType: "Perawatan",
    dueDate: "10 Sep 2026",
    status: "Mendatang",
    priority: "Sedang",
  },
]

export function RemindersPage() {
  const [sourceFilter, setSourceFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [reminders, setReminders] = useState(mockReminders)

  const handleComplete = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, status: "Selesai" } : r))
  }

  const filtered = reminders.filter((r) => {
    const matchesSource = sourceFilter === "Semua" || r.sourceType === sourceFilter
    const matchesStatus = statusFilter === "Semua" || r.status === statusFilter
    return matchesSource && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Pusat Pengingat Terpadu</h1>
          <p className="text-xs text-muted-foreground">
            Pelacakan tanggal terintegrasi untuk garansi aset, tenggat peminjaman, dan perpanjangan langganan.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Pengingat</span>
        </Button>
      </div>

      {/* Filter Chips */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">Sumber:</span>
            {["Semua", "Langganan", "Peminjaman", "Inventaris", "Perawatan"].map((source) => (
              <Button
                key={source}
                variant={sourceFilter === source ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter(source)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0 whitespace-nowrap"
              >
                {source}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">Status:</span>
            {["Semua", "Hari Ini", "Terlambat", "Mendatang", "Selesai"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="h-7 text-xs px-2.5 rounded-md text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap"
              >
                {st}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[760px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Sumber</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Judul & Deskripsi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tenggat Waktu</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Prioritas</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                      {item.sourceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className={`font-semibold text-xs ${item.status === "Selesai" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono">
                    <span className={
                      item.status === "Terlambat" ? "text-destructive font-bold" :
                      item.status === "Hari Ini" ? "text-amber-600 font-bold" :
                      "text-muted-foreground"
                    }>
                      {item.dueDate}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <span className={
                      item.priority === "Tinggi" ? "text-destructive font-semibold" :
                      item.priority === "Sedang" ? "text-amber-600" :
                      "text-muted-foreground"
                    }>
                      {item.priority}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={
                        item.status === "Hari Ini" ? "secondary" :
                        item.status === "Terlambat" ? "destructive" :
                        item.status === "Selesai" ? "outline" : "default"
                      }
                      className="text-[10px] font-mono px-2 py-0 h-5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {item.status !== "Selesai" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(item.id)}
                        className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                      >
                        <Check className="h-3 w-3" />
                        <span>Selesai</span>
                      </Button>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">Terselesaikan</span>
                    )}
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
