import { useState, useEffect, useCallback } from "react"
import {
  History,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Layers,
  Activity,
  Eye,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AuditDetailModal } from "@/components/modals/AuditDetailModal"
import { fetchAuditLogs } from "@/lib/api/auditLogs"
import { formatDateID } from "@/lib/formatters"
import type { AuditLog } from "@/types/database"

const ENTITY_LABELS: Record<string, string> = {
  all: "Semua Modul",
  inventory: "Inventaris",
  borrowing: "Peminjaman",
  subscription: "Langganan",
  reminder: "Pengingat",
  profiles: "Profil",
  categories: "Kategori",
}

const ACTION_LABELS: Record<string, string> = {
  all: "Semua Aksi",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  RETURN: "RETURN",
  SYSTEM_AUTO: "SYSTEM_AUTO",
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchAuditLogs({
        entityType: entityFilter,
        action: actionFilter,
        search: searchTerm,
        limit: 150,
      })
      setLogs(data)
    } catch (err) {
      console.error("Gagal memuat catatan log audit:", err)
    } finally {
      setIsLoading(false)
    }
  }, [entityFilter, actionFilter, searchTerm])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalLogs = logs.length
  const todayDateStr = new Date().toISOString().split("T")[0]
  const todayLogs = logs.filter((l) => l.created_at.startsWith(todayDateStr)).length

  const moduleCounts: Record<string, number> = {}
  logs.forEach((l) => {
    moduleCounts[l.entity_type] = (moduleCounts[l.entity_type] || 0) + 1
  })
  const topModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("INSERT") || act.includes("APPROVE")) {
      return <Badge variant="success" className="font-mono text-[10px]">{action}</Badge>
    }
    if (act.includes("UPDATE") || act.includes("EDIT")) {
      return <Badge variant="info" className="font-mono text-[10px]">{action}</Badge>
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REJECT")) {
      return <Badge variant="destructive" className="font-mono text-[10px]">{action}</Badge>
    }
    if (act.includes("RETURN")) {
      return <Badge variant="secondary" className="font-mono text-[10px]">{action}</Badge>
    }
    return <Badge variant="warning" className="font-mono text-[10px]">{action}</Badge>
  }

  const exportCSV = () => {
    if (logs.length === 0) return
    const headers = ["ID Log", "Waktu", "Aktor", "Email", "Role", "Aksi", "Modul", "Entity ID", "Detail JSON"]
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.created_at}"`,
      `"${l.user?.full_name || "System"}"`,
      `"${l.user?.email || "-"}"`,
      `"${l.user?.role || "system"}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${l.entity_id || "-"}"`,
      `"${l.details ? JSON.stringify(l.details).replace(/"/g, '""') : "-"}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
          Log Audit
        </h1>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ekspor</span>
          </Button>
        </div>
      </div>

      {/* Responsive KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Total Rekaman</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">{totalLogs}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <History className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Hari Ini</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                {todayLogs}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Modul Teraktif</p>
              <p className="text-sm sm:text-base font-extrabold text-foreground uppercase truncate mt-1">
                {topModule}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari aktor, aksi, atau detail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 sm:h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:flex items-center gap-2">
            <Select value={entityFilter} onValueChange={(val) => setEntityFilter(val || "all")}>
              <SelectTrigger className="h-10 sm:h-9 sm:w-36" aria-label="Filter modul">
                <SelectValue>{ENTITY_LABELS[entityFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENTITY_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
              <SelectTrigger className="h-10 sm:h-9 sm:w-36" aria-label="Filter aksi">
                <SelectValue>{ACTION_LABELS[actionFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Desktop Table + Mobile Stacked Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs">Memuat log audit...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <History className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-xs font-semibold text-foreground">Belum ada rekaman log</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table className="min-w-[780px]">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4 w-[160px] text-xs font-semibold text-muted-foreground">Waktu</TableHead>
                    <TableHead className="w-[200px] text-xs font-semibold text-muted-foreground">Aktor</TableHead>
                    <TableHead className="w-[130px] text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold text-muted-foreground">Modul</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Ringkasan</TableHead>
                    <TableHead className="px-4 w-[70px] text-right text-xs font-semibold text-muted-foreground">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const details = log.details || {}
                    const detailSummary = Object.entries(details)
                      .slice(0, 3)
                      .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
                      .join(", ")

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="px-4 py-3 text-xs">
                          <p className="font-semibold text-foreground">{formatDateID(log.created_at)}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </TableCell>

                        <TableCell className="py-3 text-xs">
                          <p className="font-semibold text-foreground truncate max-w-[170px]">
                            {log.user?.full_name || "Sistem"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                            {log.user?.email || "otomatis"}
                          </p>
                        </TableCell>

                        <TableCell className="py-3">{getActionBadge(log.action)}</TableCell>

                        <TableCell className="py-3">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            {log.entity_type}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-xs text-muted-foreground">
                          <p className="truncate max-w-sm font-mono text-[11px]">
                            {detailSummary || "-"}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setSelectedLog(log)
                              setIsDetailOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Lihat detail log audit"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-border">
              {logs.map((log) => {
                const details = log.details || {}
                const detailSummary = Object.entries(details)
                  .slice(0, 2)
                  .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
                  .join(", ")

                return (
                  <div key={log.id} className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getActionBadge(log.action)}
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {log.entity_type}
                        </Badge>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {formatDateID(log.created_at)}
                      </span>
                    </div>

                    {detailSummary && (
                      <p className="font-mono text-[11px] text-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 break-words">
                        {detailSummary}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground truncate">
                        {log.user?.full_name || "Sistem"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Detail</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <AuditDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        log={selectedLog}
      />
    </div>
  )
}
