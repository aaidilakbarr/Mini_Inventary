import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  Plus, 
  Search, 
  RotateCcw, 
  AlertTriangle,
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

const mockBorrowings = [
  {
    id: "BOR-1050",
    assetCode: "INV-MON-018",
    assetName: "Dell UltraSharp 27\" 4K",
    borrowerName: "Budi Santoso",
    department: "Teknik / Engineering",
    requestDate: "2026-08-24",
    dueDate: "2026-09-07",
    status: "Menunggu Persetujuan",
    notes: "Dibutuhkan untuk workstation setup remote",
  },
  {
    id: "BOR-1049",
    assetCode: "INV-MAC-042",
    assetName: "MacBook Pro 16\" M3 Max",
    borrowerName: "Siti Rahma",
    department: "Desain Produk",
    requestDate: "2026-08-20",
    dueDate: "2026-08-28",
    status: "Dipinjam",
    notes: "Presentasi sprint desain ke klien",
  },
  {
    id: "BOR-1045",
    assetCode: "INV-SRV-003",
    assetName: "Ubiquiti UniFi 24-Port Switch",
    borrowerName: "Aidil Pratama",
    department: "Infrastruktur IT",
    requestDate: "2026-08-10",
    dueDate: "2026-08-24",
    status: "Terlambat",
    notes: "Uji coba migrasi kantor cabang",
  },
  {
    id: "BOR-1042",
    assetCode: "INV-CAM-005",
    assetName: "Sony Alpha A7 IV Kit",
    borrowerName: "Rian Hidayat",
    department: "Pemasaran",
    requestDate: "2026-08-15",
    dueDate: "2026-08-22",
    status: "Dikembalikan",
    notes: "Photoshoot produk batch 3",
  },
]

export function BorrowingPage() {
  const { isAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = mockBorrowings.filter((b) => {
    const matchesStatus = statusFilter === "Semua" || b.status === statusFilter
    const matchesSearch = 
      b.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Siklus Peminjaman Aset</h1>
          <p className="text-xs text-muted-foreground">
            Kelola permohonan pinjam, delegasi persetujuan, aset aktif dipinjam, dan log pengembalian.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5" />
          <span>Permohonan Pinjam Baru</span>
        </Button>
      </div>

      {/* Lifecycle Flow Indicator */}
      <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[540px] gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20 shrink-0">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
            <span>Pengajuan</span>
          </div>
          <span className="text-muted-foreground shrink-0">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 shrink-0">
            <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Menunggu Persetujuan</span>
          </div>
          <span className="text-muted-foreground shrink-0">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold border border-blue-500/20 shrink-0">
            <span className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Dipinjam</span>
          </div>
          <span className="text-muted-foreground shrink-0">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 shrink-0">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">4</span>
            <span>Dikembalikan</span>
          </div>
        </div>
      </div>

      {/* Search and Status Filters */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan aset, kode, atau peminjam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {["Semua", "Menunggu Persetujuan", "Dipinjam", "Terlambat", "Dikembalikan"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0 whitespace-nowrap"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[820px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">ID Pinjam</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Detail Aset</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Peminjam & Divisi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tgl Pengajuan</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tenggat Waktu</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold text-foreground py-3">
                    {item.id}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-xs text-foreground">{item.assetName}</p>
                    <p className="font-mono text-[10px] text-primary">{item.assetCode}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-xs text-foreground font-medium">{item.borrowerName}</p>
                    <p className="text-[10px] text-muted-foreground">{item.department}</p>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                    {item.requestDate}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono">
                    <span className={item.status === "Terlambat" ? "text-destructive font-bold flex items-center gap-1" : "text-foreground"}>
                      {item.status === "Terlambat" && <AlertTriangle className="h-3 w-3 inline" />}
                      {item.dueDate}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={
                        item.status === "Dipinjam" ? "default" :
                        item.status === "Menunggu Persetujuan" ? "secondary" :
                        item.status === "Terlambat" ? "destructive" : "outline"
                      }
                      className="text-[10px] font-mono px-2 py-0 h-5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {item.status === "Menunggu Persetujuan" ? (
                      isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5">
                            Setujui
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 border-border/80">
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border/60">
                          Menunggu Admin
                        </span>
                      )
                    ) : item.status === "Dipinjam" || item.status === "Terlambat" ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/30">
                        <RotateCcw className="h-3 w-3" />
                        <span>Kembalikan</span>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
