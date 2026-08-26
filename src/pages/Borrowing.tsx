import { useState } from "react"
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Check, 
  X, 
  RotateCcw, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  MoreHorizontal
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    department: "Engineering",
    requestDate: "2026-08-24",
    dueDate: "2026-09-07",
    status: "Pending Approval",
    notes: "Needed for remote workstation setup",
  },
  {
    id: "BOR-1049",
    assetCode: "INV-MAC-042",
    assetName: "MacBook Pro 16\" M3 Max",
    borrowerName: "Siti Rahma",
    department: "Product Design",
    requestDate: "2026-08-20",
    dueDate: "2026-08-28",
    status: "Borrowed",
    notes: "Design sprint client presentations",
  },
  {
    id: "BOR-1045",
    assetCode: "INV-SRV-003",
    assetName: "Ubiquiti UniFi 24-Port Switch",
    borrowerName: "Aidil Pratama",
    department: "IT Infrastructure",
    requestDate: "2026-08-10",
    dueDate: "2026-08-24",
    status: "Overdue",
    notes: "Testing branch office migration",
  },
  {
    id: "BOR-1042",
    assetCode: "INV-CAM-005",
    assetName: "Sony Alpha A7 IV Kit",
    borrowerName: "Rian Hidayat",
    department: "Marketing",
    requestDate: "2026-08-15",
    dueDate: "2026-08-22",
    status: "Returned",
    notes: "Product photoshoot batch 3",
  },
]

export function BorrowingPage() {
  const [statusFilter, setStatusFilter] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = mockBorrowings.filter((b) => {
    const matchesStatus = statusFilter === "All" || b.status === statusFilter
    const matchesSearch = 
      b.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Asset Borrowing Lifecycle</h1>
          <p className="text-xs text-muted-foreground">
            Manage asset requests, approval delegations, active checkouts, and return logs.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>New Borrow Request</span>
        </Button>
      </div>

      {/* Lifecycle Flow Indicator */}
      <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px] gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
            <span>Request</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
            <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Pending Approval</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold border border-blue-500/20">
            <span className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Borrowed</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">4</span>
            <span>Returned</span>
          </div>
        </div>
      </div>

      {/* Search and Status Filters */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by asset, code, or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["All", "Pending Approval", "Borrowed", "Overdue", "Returned"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="h-7 text-xs px-2.5 rounded-md"
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
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Borrow ID</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Asset Details</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Borrower & Dept</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Requested</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Due Date</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Action</TableHead>
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
                    <span className={item.status === "Overdue" ? "text-destructive font-bold flex items-center gap-1" : "text-foreground"}>
                      {item.status === "Overdue" && <AlertTriangle className="h-3 w-3 inline" />}
                      {item.dueDate}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={
                        item.status === "Borrowed" ? "default" :
                        item.status === "Pending Approval" ? "secondary" :
                        item.status === "Overdue" ? "destructive" : "outline"
                      }
                      className="text-[10px] font-mono px-2 py-0 h-5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {item.status === "Pending Approval" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 border-border/80">
                          Reject
                        </Button>
                      </div>
                    ) : item.status === "Borrowed" || item.status === "Overdue" ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/30">
                        <RotateCcw className="h-3 w-3" />
                        <span>Return</span>
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
