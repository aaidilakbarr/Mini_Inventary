import { useState } from "react"
import { 
  Bell, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter,
  Check,
  X,
  Tag
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

const mockReminders = [
  {
    id: "REM-01",
    title: "AWS Cloud Infrastructure Monthly Billing",
    description: "Scheduled recurring charge for production ECS & RDS clusters",
    sourceType: "Subscription",
    dueDate: "2026-08-26 (Today)",
    status: "Due Today",
    priority: "High",
  },
  {
    id: "REM-02",
    title: "Return Due: Ubiquiti UniFi Switch (Aidil)",
    description: "Asset BOR-1045 return deadline exceeded by 2 days",
    sourceType: "Borrowing",
    dueDate: "2026-08-24 (Overdue)",
    status: "Overdue",
    priority: "High",
  },
  {
    id: "REM-03",
    title: "Dell XPS 15 Warranty Expiration",
    description: "Warranty coverage ending for asset INV-XPS-009",
    sourceType: "Inventory",
    dueDate: "2026-08-27",
    status: "Upcoming",
    priority: "Medium",
  },
  {
    id: "REM-04",
    title: "Google Workspace 50 Seats Renewal",
    description: "Annual SaaS productivity license auto-debit renewal",
    sourceType: "Subscription",
    dueDate: "2026-08-31",
    status: "Upcoming",
    priority: "Low",
  },
  {
    id: "REM-05",
    title: "Server Room UPS Battery Maintenance",
    description: "Semi-annual scheduled check by vendor",
    sourceType: "Maintenance",
    dueDate: "2026-09-10",
    status: "Upcoming",
    priority: "Medium",
  },
]

export function RemindersPage() {
  const [sourceFilter, setSourceFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [reminders, setReminders] = useState(mockReminders)

  const handleComplete = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, status: "Completed" } : r))
  }

  const filtered = reminders.filter((r) => {
    const matchesSource = sourceFilter === "All" || r.sourceType === sourceFilter
    const matchesStatus = statusFilter === "All" || r.status === statusFilter
    return matchesSource && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Central Reminder Hub</h1>
          <p className="text-xs text-muted-foreground">
            Unified date tracking across asset warranties, borrowing deadlines, and subscription renewals.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5" />
          <span>New Reminder</span>
        </Button>
      </div>

      {/* Filter Chips */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">Source:</span>
            {["All", "Subscription", "Borrowing", "Inventory", "Maintenance"].map((source) => (
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
            {["All", "Due Today", "Overdue", "Upcoming", "Completed"].map((st) => (
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
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Source</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Title & Context</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Due Date</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Priority</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Action</TableHead>
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
                    <p className={`font-semibold text-xs ${item.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono">
                    <span className={
                      item.status === "Overdue" ? "text-destructive font-bold" :
                      item.status === "Due Today" ? "text-amber-600 font-bold" :
                      "text-muted-foreground"
                    }>
                      {item.dueDate}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <span className={
                      item.priority === "High" ? "text-destructive font-semibold" :
                      item.priority === "Medium" ? "text-amber-600" :
                      "text-muted-foreground"
                    }>
                      {item.priority}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant={
                        item.status === "Due Today" ? "secondary" :
                        item.status === "Overdue" ? "destructive" :
                        item.status === "Completed" ? "outline" : "default"
                      }
                      className="text-[10px] font-mono px-2 py-0 h-5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {item.status !== "Completed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(item.id)}
                        className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                      >
                        <Check className="h-3 w-3" />
                        <span>Done</span>
                      </Button>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">Resolved</span>
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
