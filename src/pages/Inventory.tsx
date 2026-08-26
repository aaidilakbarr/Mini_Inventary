import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Download
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

const mockInventories = [
  {
    id: "1",
    code: "INV-MAC-001",
    name: "MacBook Pro 14\" M3 Pro (18GB/512GB)",
    category: "Laptop",
    location: "Gudang IT - Rak A1",
    quantity: 5,
    condition: "Bagus",
    status: "Tersedia",
    supplier: "Apple Store ID",
    warrantyUntil: "15 Feb 2027",
  },
  {
    id: "2",
    code: "INV-MAC-042",
    name: "MacBook Pro 16\" M3 Max",
    category: "Laptop",
    location: "Dipinjam (Siti Rahma)",
    quantity: 1,
    condition: "Bagus",
    status: "Dipinjam",
    supplier: "iBox Indonesia",
    warrantyUntil: "20 Nov 2026",
  },
  {
    id: "3",
    code: "INV-MON-018",
    name: "Dell UltraSharp 27\" 4K USB-C Hub Monitor",
    category: "Monitor",
    location: "Lantai 3 - Pod Dev B",
    quantity: 12,
    condition: "Bagus",
    status: "Tersedia",
    supplier: "Dell Direct",
    warrantyUntil: "10 Mei 2028",
  },
  {
    id: "4",
    code: "INV-SRV-003",
    name: "Ubiquiti UniFi 24-Port PoE Switch",
    category: "Jaringan",
    location: "Ruang Server Rack 02",
    quantity: 2,
    condition: "Cukup",
    status: "Perawatan",
    supplier: "PT Integra Solusi",
    warrantyUntil: "14 Agu 2025",
  },
  {
    id: "5",
    code: "INV-CAM-005",
    name: "Sony Alpha A7 IV Mirrorless Camera Kit",
    category: "Media",
    location: "Lemari Studio B",
    quantity: 1,
    condition: "Bagus",
    status: "Tersedia",
    supplier: "Doss Camera",
    warrantyUntil: "01 Des 2026",
  },
]

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Semua")

  const filteredItems = mockInventories.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "Semua" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Manajemen Inventaris</h1>
          <p className="text-xs text-muted-foreground">
            Lacak, kelola, dan katalog aset fisik serta perangkat keras perusahaan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-8 text-xs font-medium gap-1.5 border-border/80">
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-initial h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Aset</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan kode, model, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {["Semua", "Laptop", "Monitor", "Jaringan", "Media"].map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0"
              >
                {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Inventory Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kode Aset</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Nama Barang / Model</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kategori</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Lokasi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-center">Jumlah</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Garansi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold text-primary py-3">
                    {item.code}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-xs text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.supplier}</p>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-border/80">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-foreground">
                    {item.location}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono font-bold text-center">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                    {item.warrantyUntil}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={
                        item.status === "Tersedia" ? "default" :
                        item.status === "Dipinjam" ? "secondary" :
                        item.status === "Perawatan" ? "destructive" : "outline"
                      }
                      className="text-[10px] font-mono px-2 py-0 h-5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
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
