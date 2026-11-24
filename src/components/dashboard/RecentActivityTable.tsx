import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Eye, User } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateID } from "@/lib/formatters"
import type { AuditLog } from "@/types/database"

interface RecentActivityTableProps {
  logs: AuditLog[]
  onViewDetail: (log: AuditLog) => void
}

type TabKey = "all" | "inventory" | "borrowing" | "subscription" | "reminder"

export function RecentActivityTable({ logs, onViewDetail }: RecentActivityTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all")

  const filteredLogs = useMemo(() => {
    if (activeTab === "all") return logs
    return logs.filter((log) => {
      const entity = (log.entity_type || "").toLowerCase()
      if (activeTab === "inventory") return entity === "inventory" || entity === "inventories"
      if (activeTab === "borrowing") return entity === "borrowing" || entity === "borrowings"
      if (activeTab === "subscription") return entity === "subscription" || entity === "subscriptions"
      if (activeTab === "reminder") return entity === "reminder" || entity === "reminders"
      return true
    })
  }, [logs, activeTab])

  const getModuleBadge = (entityType: string) => {
    const e = (entityType || "").toLowerCase()
    if (e.includes("inventory")) return <Badge variant="info">Inventaris</Badge>
    if (e.includes("borrowing")) return <Badge variant="default">Peminjaman</Badge>
    if (e.includes("subscription")) return <Badge variant="success">Langganan</Badge>
    if (e.includes("reminder")) return <Badge variant="warning">Agenda</Badge>
    return <Badge variant="outline">{entityType || "Sistem"}</Badge>
  }

  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase()
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("TAMBAH")) {
      return <Badge variant="success">Tambah</Badge>
    }
    if (act.includes("APPROVE") || act.includes("SETUJUI")) {
      return <Badge variant="success">Disetujui</Badge>
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("UBAH")) {
      return <Badge variant="info">Pembaruan</Badge>
    }
    if (act.includes("RETURN") || act.includes("KEMBALI")) {
      return <Badge variant="secondary">Pengembalian</Badge>
    }
    if (act.includes("DELETE") || act.includes("REJECT") || act.includes("HAPUS")) {
      return <Badge variant="destructive">{act.includes("REJECT") ? "Ditolak" : "Dihapus"}</Badge>
    }
    return <Badge variant="outline">{action}</Badge>
  }

  const formatActionSummary = (log: AuditLog) => {
    if (log.details && typeof log.details === "object") {
      if (log.details.description) return String(log.details.description)
      if (log.details.message) return String(log.details.message)
      if (log.details.name) return String(log.details.name)
    }
    return `${log.action} · ${log.entity_type}`
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <Link to="/audit-logs" className="text-xs font-semibold text-primary hover:underline">
            Semua Log
          </Link>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab((val as TabKey) || "all")}
        >
          <TabsList className="w-full sm:w-fit overflow-x-auto justify-start">
            <TabsTrigger value="all" className="flex-none">Semua</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-none">Inventaris</TabsTrigger>
            <TabsTrigger value="borrowing" className="flex-none">Peminjaman</TabsTrigger>
            <TabsTrigger value="subscription" className="flex-none">Langganan</TabsTrigger>
            <TabsTrigger value="reminder" className="flex-none">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Belum ada aktivitas untuk kategori ini.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-5 text-xs font-semibold text-muted-foreground">Aktivitas</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Modul</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Pengguna</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Waktu</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="px-5 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 7).map((log) => (
                    <TableRow key={log.id} className="transition-colors duration-150">
                      <TableCell className="px-5 py-3 max-w-[280px]">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {formatActionSummary(log)}
                        </p>
                      </TableCell>
                      <TableCell className="py-3">{getModuleBadge(log.entity_type)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {log.user?.full_name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                          </div>
                          <span className="truncate max-w-[130px]">
                            {log.user?.full_name || "Sistem"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                        {formatDateID(log.created_at)}
                      </TableCell>
                      <TableCell className="py-3">{getActionBadge(log.action)}</TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => onViewDetail(log)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-semibold text-foreground line-clamp-2">
                        {formatActionSummary(log)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getModuleBadge(log.entity_type)}
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {formatDateID(log.created_at)}
                        </span>
                      </div>
                    </div>
                    {getActionBadge(log.action)}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground truncate">
                      {log.user?.full_name || "Sistem"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(log)}
                      className="h-9 px-3"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Detail</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
