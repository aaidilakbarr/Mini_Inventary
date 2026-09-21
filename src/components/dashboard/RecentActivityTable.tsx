import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { History, ArrowRight, Eye, User } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    if (e.includes("inventory")) {
      return (
        <Badge variant="outline" className="text-[10px] font-medium border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
          Inventaris
        </Badge>
      )
    }
    if (e.includes("borrowing")) {
      return (
        <Badge variant="outline" className="text-[10px] font-medium border-indigo-200 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
          Peminjaman
        </Badge>
      )
    }
    if (e.includes("subscription")) {
      return (
        <Badge variant="outline" className="text-[10px] font-medium border-emerald-200 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
          Langganan
        </Badge>
      )
    }
    if (e.includes("reminder")) {
      return (
        <Badge variant="outline" className="text-[10px] font-medium border-amber-200 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
          Pengingat
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
        {entityType || "Sistem"}
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase()
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("TAMBAH")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
          Tambah
        </span>
      )
    }
    if (act.includes("APPROVE") || act.includes("SETUJUI")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/40">
          Disetujui
        </span>
      )
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("UBAH")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
          Pembaruan
        </span>
      )
    }
    if (act.includes("RETURN") || act.includes("KEMBALI")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
          Pengembalian
        </span>
      )
    }
    if (act.includes("DELETE") || act.includes("REJECT") || act.includes("HAPUS")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40">
          {act.includes("REJECT") ? "Ditolak" : "Dihapus"}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-muted px-2 py-0.5 rounded-full">
        {action}
      </span>
    )
  }

  const formatActionSummary = (log: AuditLog) => {
    if (log.details && typeof log.details === "object") {
      if (log.details.description) return String(log.details.description)
      if (log.details.message) return String(log.details.message)
      if (log.details.name) return `Aset: ${log.details.name}`
    }
    return `${log.action} pada ${log.entity_type}`
  }

  return (
    <Card className="border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                Aktivitas Sistem Terbaru
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Jejak audit otomatis dari perubahan data dan persetujuan operasional
            </CardDescription>
          </div>

          <Link to="/audit-logs">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-primary border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1 font-semibold cursor-pointer shadow-2xs"
            >
              <span>Buka Log Audit Lengkap</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Tab Filters Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 -mb-1 scrollbar-none">
          {[
            { key: "all", label: "Semua" },
            { key: "inventory", label: "Inventaris" },
            { key: "borrowing", label: "Peminjaman" },
            { key: "subscription", label: "Langganan" },
            { key: "reminder", label: "Pengingat" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada aktivitas log audit tercatat untuk kategori ini.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Aktivitas</th>
                    <th className="py-2.5 px-3">Modul</th>
                    <th className="py-2.5 px-3">Pengguna</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.slice(0, 7).map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 max-w-[280px]">
                        <p className="font-semibold text-foreground truncate">
                          {formatActionSummary(log)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          ID: {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getModuleBadge(log.entity_type)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {log.user?.full_name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                          </div>
                          <span className="truncate max-w-[130px]">
                            {log.user?.full_name || "Sistem"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {formatDateID(log.created_at)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(log)}
                          className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                          title="Inspeksi Detail Log"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card List */}
            <div className="md:hidden divide-y divide-border/60">
              {filteredLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3.5 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {formatActionSummary(log)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {getModuleBadge(log.entity_type)}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateID(log.created_at)}
                        </span>
                      </div>
                    </div>
                    {getActionBadge(log.action)}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span className="truncate">Oleh: {log.user?.full_name || "Sistem"}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(log)}
                      className="h-6 px-2 text-[11px] text-primary hover:bg-primary/5 gap-1"
                    >
                      <Eye className="h-3 w-3" />
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
