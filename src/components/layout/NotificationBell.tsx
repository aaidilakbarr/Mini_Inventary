import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Bell,
  AlertTriangle,
  Clock,
  CreditCard,
  CalendarCheck2,
  CheckCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { formatDateID } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface AppNotification {
  id: string
  category: "borrowing_overdue" | "borrowing_pending" | "borrowing_due" | "subscription" | "agenda"
  title: string
  subtitle: string
  date: string
  severity: "destructive" | "warning" | "info"
  href: string
  sortWeight: number
}

function getStorageKey(userId?: string) {
  return `stockly_read_notifications_${userId || "guest"}`
}

function loadReadIds(userId?: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

function saveReadIds(userId: string | undefined, ids: string[]) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(ids.slice(-200)))
  } catch {
    // Ignore storage quota errors
  }
}

export function NotificationBell() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<string[]>(() => loadReadIds(user?.id))
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  useEffect(() => {
    setReadIds(loadReadIds(user?.id))
  }, [user?.id])

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      setIsLoading(true)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const items: AppNotification[] = []

      let borrowQuery = supabase
        .from("borrowings")
        .select("id, status, due_date, request_date, borrower_id, inventory:inventories(name, code), borrower:profiles(full_name)")
        .in("status", ["Borrowed", "Pending Approval"])
        .order("due_date", { ascending: true })
        .limit(40)

      if (!isAdmin) {
        borrowQuery = borrowQuery.eq("borrower_id", user.id)
      }

      if (isAdmin) {
        const [borrowRes, subRes, agendaRes] = await Promise.all([
          borrowQuery,
          supabase
            .from("subscriptions")
            .select("id, service_name, next_billing_date, status")
            .in("status", ["Active", "Past Due"])
            .order("next_billing_date", { ascending: true })
            .limit(20),
          supabase
            .from("reminders")
            .select("id, title, description, due_date, priority, status")
            .neq("status", "Completed")
            .neq("status", "Dismissed")
            .order("due_date", { ascending: true })
            .limit(20),
        ])

        const borrowings = (borrowRes.data || []) as any[]
        for (const b of borrowings) {
          const invName = b.inventory?.name || "Aset"
          const borrowerName = b.borrower?.full_name || "Pengguna"
          if (b.status === "Pending Approval") {
            items.push({
              id: `pending-${b.id}`,
              category: "borrowing_pending",
              title: `Permohonan Pinjam: ${invName}`,
              subtitle: `Diajukan oleh ${borrowerName}`,
              date: b.request_date || b.due_date,
              severity: "warning",
              href: "/borrowing",
              sortWeight: 2,
            })
          } else if (b.status === "Borrowed" && b.due_date) {
            const due = new Date(b.due_date)
            if (due < today) {
              items.push({
                id: `overdue-${b.id}-${b.due_date}`,
                category: "borrowing_overdue",
                title: `Terlambat Kembali: ${invName}`,
                subtitle: `Peminjam: ${borrowerName}`,
                date: b.due_date,
                severity: "destructive",
                href: "/borrowing",
                sortWeight: 1,
              })
            } else if (due <= in3Days) {
              items.push({
                id: `due-${b.id}-${b.due_date}`,
                category: "borrowing_due",
                title: `Jatuh Tempo Segera: ${invName}`,
                subtitle: `Peminjam: ${borrowerName}`,
                date: b.due_date,
                severity: "info",
                href: "/borrowing",
                sortWeight: 4,
              })
            }
          }
        }

        const subscriptions = (subRes.data || []) as any[]
        for (const s of subscriptions) {
          if (!s.next_billing_date) continue
          const billDate = new Date(s.next_billing_date)
          if (s.status === "Past Due" || billDate < today) {
            items.push({
              id: `sub-overdue-${s.id}-${s.next_billing_date}`,
              category: "subscription",
              title: `Tagihan Terlewat: ${s.service_name}`,
              subtitle: "Perlu perpanjangan langganan",
              date: s.next_billing_date,
              severity: "destructive",
              href: "/subscriptions",
              sortWeight: 1,
            })
          } else if (billDate <= in7Days) {
            items.push({
              id: `sub-soon-${s.id}-${s.next_billing_date}`,
              category: "subscription",
              title: `Tagihan Mendekat: ${s.service_name}`,
              subtitle: "Jatuh tempo dalam 7 hari",
              date: s.next_billing_date,
              severity: "warning",
              href: "/subscriptions",
              sortWeight: 3,
            })
          }
        }

        const agendas = (agendaRes.data || []) as any[]
        for (const a of agendas) {
          const due = a.due_date ? new Date(a.due_date) : null
          const isOverdue = a.status === "Overdue" || (due !== null && due < today)
          const isSoon = due !== null && due <= in3Days
          if (isOverdue || isSoon || a.priority === "Tinggi") {
            items.push({
              id: `agenda-${a.id}-${a.status}`,
              category: "agenda",
              title: a.title,
              subtitle: isOverdue
                ? "Agenda melewati tenggat"
                : a.priority === "Tinggi"
                ? "Agenda prioritas tinggi"
                : "Agenda segera jatuh tempo",
              date: a.due_date,
              severity: isOverdue ? "destructive" : "warning",
              href: "/agenda",
              sortWeight: isOverdue ? 1 : 3,
            })
          }
        }
      } else {
        const { data: borrowData } = await borrowQuery
        const borrowings = (borrowData || []) as any[]

        for (const b of borrowings) {
          const invName = b.inventory?.name || "Aset"
          if (b.status === "Pending Approval") {
            items.push({
              id: `user-pending-${b.id}`,
              category: "borrowing_pending",
              title: `Menunggu Persetujuan: ${invName}`,
              subtitle: "Permohonan peminjaman sedang ditinjau admin",
              date: b.request_date || b.due_date,
              severity: "warning",
              href: "/borrowing",
              sortWeight: 3,
            })
          } else if (b.status === "Borrowed" && b.due_date) {
            const due = new Date(b.due_date)
            if (due < today) {
              items.push({
                id: `user-overdue-${b.id}-${b.due_date}`,
                category: "borrowing_overdue",
                title: `Peminjaman Terlambat: ${invName}`,
                subtitle: "Segera lakukan pengembalian aset",
                date: b.due_date,
                severity: "destructive",
                href: "/borrowing",
                sortWeight: 1,
              })
            } else if (due <= in3Days) {
              items.push({
                id: `user-due-${b.id}-${b.due_date}`,
                category: "borrowing_due",
                title: `Tenggat Segera: ${invName}`,
                subtitle: "Batas pengembalian dalam 3 hari",
                date: b.due_date,
                severity: "info",
                href: "/borrowing",
                sortWeight: 2,
              })
            }
          }
        }
      }

      items.sort((a, b) => {
        if (a.sortWeight !== b.sortWeight) return a.sortWeight - b.sortWeight
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setNotifications(items)
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, isAdmin])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications, location.pathname])

  const readSet = useMemo(() => new Set(readIds), [readIds])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readSet.has(n.id)).length,
    [notifications, readSet]
  )

  const displayed = useMemo(
    () => (showUnreadOnly ? notifications.filter((n) => !readSet.has(n.id)) : notifications),
    [notifications, readSet, showUnreadOnly]
  )

  const markAsRead = (id: string) => {
    if (readSet.has(id)) return
    const next = [...readIds, id]
    setReadIds(next)
    saveReadIds(user?.id, next)
  }

  const markAllAsRead = () => {
    const merged = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]))
    setReadIds(merged)
    saveReadIds(user?.id, merged)
  }

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id)
    setOpen(false)
    navigate(item.href)
  }

  const renderCategoryIcon = (item: AppNotification) => {
    const iconBg =
      item.severity === "destructive"
        ? "bg-destructive/10 text-destructive"
        : item.severity === "warning"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-primary/10 text-primary"

    const Icon =
      item.category === "borrowing_overdue"
        ? AlertTriangle
        : item.category === "subscription"
        ? CreditCard
        : item.category === "agenda"
        ? CalendarCheck2
        : Clock

    return (
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
        <Icon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) loadNotifications()
      }}
    >
      <PopoverTrigger
        aria-label={unreadCount > 0 ? `Notifikasi (${unreadCount} belum dibaca)` : "Notifikasi"}
        title="Notifikasi"
        className={cn(
          "relative inline-flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer",
          open && "border-primary/40 bg-primary/5 text-primary"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none shadow-sm tabular-nums">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 p-0 overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-foreground">Notifikasi</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-mono">
                {unreadCount} baru
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={markAllAsRead}
                className="text-[11px] text-primary hover:text-primary hover:bg-primary/10 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tandai dibaca</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={loadNotifications}
              disabled={isLoading}
              aria-label="Segarkan notifikasi"
              className="text-muted-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        {notifications.length > 0 && (
          <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-1.5">
            <Button
              type="button"
              size="xs"
              variant={!showUnreadOnly ? "default" : "ghost"}
              onClick={() => setShowUnreadOnly(false)}
              className="rounded-full h-6 px-2.5 text-[11px]"
            >
              Semua ({notifications.length})
            </Button>
            <Button
              type="button"
              size="xs"
              variant={showUnreadOnly ? "default" : "ghost"}
              onClick={() => setShowUnreadOnly(true)}
              className="rounded-full h-6 px-2.5 text-[11px]"
            >
              Belum dibaca ({unreadCount})
            </Button>
          </div>
        )}

        {/* List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border">
          {isLoading && notifications.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs">Memuat notifikasi...</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-10 px-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-7 w-7 text-emerald-600/80" />
              <p className="text-xs font-semibold text-foreground">
                {showUnreadOnly ? "Semua notifikasi sudah dibaca" : "Tidak ada notifikasi aktif"}
              </p>
            </div>
          ) : (
            displayed.map((item) => {
              const isUnread = !readSet.has(item.id)
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "w-full h-auto rounded-none justify-start text-left px-4 py-3 flex items-start gap-3 font-normal whitespace-normal hover:bg-accent/60",
                    isUnread && "bg-primary/[0.03]"
                  )}
                >
                  {renderCategoryIcon(item)}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-xs leading-snug line-clamp-1", isUnread ? "font-bold text-foreground" : "font-medium text-foreground/85")}>
                        {item.title}
                      </p>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{item.subtitle}</p>
                    <p className="text-[10px] font-mono text-muted-foreground pt-0.5">
                      {formatDateID(item.date)}
                    </p>
                  </div>
                </Button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setOpen(false)
              navigate(isAdmin ? "/agenda" : "/borrowing")
            }}
            className="w-full justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
          >
            <span>{isAdmin ? "Buka halaman Agenda" : "Lihat Peminjaman Saya"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
