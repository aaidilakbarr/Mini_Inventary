import { useState, useEffect, useCallback } from "react"
import { 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  Loader2, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Eye,
  Calendar,
  Filter
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { AuditDetailModal } from "@/components/modals/AuditDetailModal"
import { fetchAuditLogs } from "@/lib/api/auditLogs"
import { formatDateID } from "@/lib/formatters"
import type { AuditLog } from "@/types/database"

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchAuditLogs({
        entityType: entityFilter,
        action: actionFilter,
        search: searchTerm,
        limit: 150
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

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  // Calculate quick metrics
  const totalLogs = logs.length
  const todayDateStr = new Date().toISOString().split('T')[0]
  const todayLogs = logs.filter(l => l.created_at.startsWith(todayDateStr)).length
  
  // Count most active module
  const moduleCounts: Record<string, number> = {}
  logs.forEach(l => {
    moduleCounts[l.entity_type] = (moduleCounts[l.entity_type] || 0) + 1
  })
  const topModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) {
      return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    if (act.includes('APPROVE')) {
      return <Badge variant="outline" className="bg-teal-500/15 text-teal-600 border-teal-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    if (act.includes('REJECT')) {
      return <Badge variant="outline" className="bg-red-500/15 text-red-600 border-red-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    if (act.includes('RETURN')) {
      return <Badge variant="outline" className="bg-purple-500/15 text-purple-600 border-purple-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
    }
    return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-mono text-[10px] font-bold rounded-full px-2.5 py-0.5">{action}</Badge>
  }

  const exportCSV = () => {
    if (logs.length === 0) return
    const headers = ["ID Log", "Waktu", "Aktor", "Email Aktor", "Role", "Aksi", "Modul/Entitas", "Entity ID", "Detail JSON"]
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.created_at}"`,
      `"${l.user?.full_name || 'System'}"`,
      `"${l.user?.email || '-'}"`,
      `"${l.user?.role || 'system'}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${l.entity_id || '-'}"`,
      `"${l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '-'}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Log Audit Sistem
            </h1>
            <Badge variant="outline" className="h-5 px-2.5 text-[10px] font-mono gap-1 text-primary border-primary/30 bg-primary/5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Only</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rekaman jejak aktivitas, mutasi data, dan persetujuan yang dilakukan oleh pengguna maupun sistem otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Total Rekaman</p>
              <p className="text-lg sm:text-xl font-bold text-foreground font-mono">{totalLogs}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <History className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Aktivitas Hari Ini</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 font-mono">{todayLogs}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Modul Teraktif</p>
              <p className="text-sm sm:text-base font-bold text-foreground font-mono uppercase">{topModule}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Integritas Log</p>
              <p className="text-xs sm:text-sm font-bold text-primary font-mono flex items-center gap-1">
                <span>Row-Level Sec</span>
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-3.5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari aktor, email, aksi, kode aset, atau isi perubahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/40 border-border/80 focus:bg-background w-full"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select value={entityFilter} onValueChange={(val) => setEntityFilter(val || "all")}>
                <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/80">
                  <div className="flex items-center gap-1 truncate">
                    <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Modul" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Modul</SelectItem>
                  <SelectItem value="inventory">Inventaris</SelectItem>
                  <SelectItem value="borrowing">Peminjaman</SelectItem>
                  <SelectItem value="subscription">Langganan</SelectItem>
                  <SelectItem value="reminder">Pengingat</SelectItem>
                  <SelectItem value="profiles">Profil / Akun</SelectItem>
                  <SelectItem value="categories">Kategori</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="w-36">
              <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
                <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/80">
                  <SelectValue placeholder="Jenis Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="CREATE">CREATE / ADD</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="APPROVE">APPROVE</SelectItem>
                  <SelectItem value="REJECT">REJECT</SelectItem>
                  <SelectItem value="RETURN">RETURN</SelectItem>
                  <SelectItem value="SYSTEM_AUTO">SYSTEM_AUTO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/80 hover:bg-transparent">
                <TableHead className="w-[170px] text-xs font-semibold text-foreground">Waktu & Tanggal</TableHead>
                <TableHead className="w-[200px] text-xs font-semibold text-foreground">Aktor / Pelaku</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-foreground">Aksi</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold text-foreground">Entitas Modul</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">Ringkasan Detail</TableHead>
                <TableHead className="w-[90px] text-right text-xs font-semibold text-foreground">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Memuat rekaman log audit...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <History className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-xs font-medium">Belum ada rekaman log audit yang sesuai.</p>
                      <p className="text-[11px]">Setiap mutasi data dan aksi administratif akan otomatis tercatat di sini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const details = log.details || {}
                  const detailSummary = Object.entries(details)
                    .slice(0, 3)
                    .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
                    .join(', ')

                  return (
                    <TableRow key={log.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      {/* Waktu */}
                      <TableCell className="text-xs font-medium text-foreground py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-semibold leading-tight">{formatDateID(log.created_at)}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Aktor */}
                      <TableCell className="text-xs py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                            {log.user?.full_name ? log.user.full_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate leading-tight">
                              {log.user?.full_name || 'System Auto'}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground truncate">{log.user?.email || 'automated trigger'}</span>
                              <Badge 
                                variant={log.user?.role === 'admin' ? 'default' : 'secondary'} 
                                className="text-[8px] uppercase px-1.5 py-0.5 rounded-full font-mono"
                              >
                                {log.user?.role || 'SYS'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-xs py-3">
                        {getActionBadge(log.action)}
                      </TableCell>

                      {/* Entitas */}
                      <TableCell className="text-xs py-3">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="secondary" className="font-mono text-[10px] uppercase w-fit rounded-full px-2.5 py-0.5">
                            {log.entity_type}
                          </Badge>
                          {log.entity_id && (
                            <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[120px]" title={log.entity_id}>
                              ID: {log.entity_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Ringkasan */}
                      <TableCell className="text-xs text-muted-foreground py-3">
                        <p className="truncate max-w-md font-mono text-[11px] bg-muted/40 px-2 py-1 rounded border border-border/50">
                          {detailSummary || '(Tidak ada rincian tambahan)'}
                        </p>
                      </TableCell>

                      {/* Aksi Detail */}
                      <TableCell className="text-right py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenDetail(log)}
                          title="Inspeksi Detail JSON"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Modal */}
      <AuditDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        log={selectedLog}
      />
    </div>
  )
}
