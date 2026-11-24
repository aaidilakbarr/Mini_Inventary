import { useState, useEffect, useCallback } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  CreditCard,
  Bell,
  History,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  CalendarDays,
  HelpCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeVariant?: "default" | "warning" | "destructive" | "outline"
  isComingSoon?: boolean
}

interface SecondaryNavItem {
  name: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  onClick?: () => void
}

export function BaseLayout() {
  const location = useLocation()
  const { user, profile, isAdmin, signOut } = useAuth()
  const [sidebarSearch, setSidebarSearch] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  const [counts, setCounts] = useState({
    inventories: 0,
    pendingBorrowings: 0,
    activeBorrowings: 0,
    activeSubscriptions: 0,
    urgentReminders: 0,
  })

  const loadCounts = useCallback(async () => {
    try {
      const [invRes, pendingBorrowRes, activeBorrowRes, subRes, reminderRes] = await Promise.all([
        supabase.from("inventories").select("id", { count: "exact", head: true }),
        supabase.from("borrowings").select("id", { count: "exact", head: true }).eq("status", "Pending Approval"),
        supabase.from("borrowings").select("id", { count: "exact", head: true }).eq("status", "Borrowed"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("reminders").select("id", { count: "exact", head: true }).neq("status", "Completed"),
      ])

      setCounts({
        inventories: invRes.count ?? 0,
        pendingBorrowings: pendingBorrowRes.count ?? 0,
        activeBorrowings: activeBorrowRes.count ?? 0,
        activeSubscriptions: subRes.count ?? 0,
        urgentReminders: reminderRes.count ?? 0,
      })
    } catch (err) {
      console.error("Gagal memuat counter sidebar:", err)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts, location.pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const primaryNavItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Inventaris",
      href: "/inventory",
      icon: Package,
      badge: counts.inventories > 0 ? String(counts.inventories) : undefined,
      badgeVariant: "outline",
    },
    {
      name: "Peminjaman",
      href: "/borrowing",
      icon: ArrowLeftRight,
      badge:
        counts.pendingBorrowings > 0
          ? String(counts.pendingBorrowings)
          : counts.activeBorrowings > 0
          ? String(counts.activeBorrowings)
          : undefined,
      badgeVariant: counts.pendingBorrowings > 0 ? "warning" : "outline",
    },
    {
      name: "Langganan",
      href: "/subscriptions",
      icon: CreditCard,
      badge: counts.activeSubscriptions > 0 ? String(counts.activeSubscriptions) : undefined,
      badgeVariant: "outline",
    },
    {
      name: "Pengingat",
      href: "/reminders",
      icon: Bell,
      badge: counts.urgentReminders > 0 ? String(counts.urgentReminders) : undefined,
      badgeVariant: "destructive",
    },
    {
      name: "Planner",
      href: "#",
      icon: CalendarDays,
      badge: "Segera",
      badgeVariant: "outline",
      isComingSoon: true,
    },
  ]

  const mobileBottomItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, count: 0 },
    { name: "Inventaris", href: "/inventory", icon: Package, count: 0 },
    { name: "Pinjam", href: "/borrowing", icon: ArrowLeftRight, count: counts.pendingBorrowings },
    { name: "Agenda", href: "/reminders", icon: Bell, count: counts.urgentReminders },
  ]

  const secondaryNavItems: SecondaryNavItem[] = [
    { name: "Log Audit", href: "/audit-logs", icon: History, adminOnly: true },
    { name: "Pengaturan", href: "/settings", icon: Settings, adminOnly: true },
    {
      name: "Bantuan",
      href: "#",
      icon: HelpCircle,
      onClick: () => {
        setIsMobileMenuOpen(false)
        setIsHelpModalOpen(true)
      },
    },
  ].filter((item) => !item.adminOnly || isAdmin)

  const filteredNav = primaryNavItems.filter((item) =>
    item.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  )

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna"
  const displayEmail = profile?.email || user?.email || ""

  const getActiveTitle = () => {
    if (location.pathname === "/dashboard") return "Dashboard"
    if (location.pathname.startsWith("/inventory")) return "Inventaris"
    if (location.pathname.startsWith("/borrowing")) return "Peminjaman"
    if (location.pathname.startsWith("/subscriptions")) return "Langganan"
    if (location.pathname.startsWith("/reminders")) return "Pengingat"
    if (location.pathname.startsWith("/audit-logs")) return "Log Audit"
    if (location.pathname.startsWith("/settings")) return "Pengaturan"
    if (location.pathname.startsWith("/profile")) return "Profil"
    return "Halaman"
  }

  const navigationContent = (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="h-14 lg:h-16 flex items-center px-5 border-b border-border shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground transition-transform duration-150 group-hover:scale-105">
            <Package className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">Stockly</span>
        </Link>
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari menu..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="h-9 lg:h-8 pl-8 pr-8 bg-muted/60 border-transparent focus-visible:bg-card focus-visible:border-input"
          />
          {sidebarSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSidebarSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Hapus pencarian menu"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <nav aria-label="Navigasi utama" className="grid grid-cols-2 gap-2">
          {filteredNav.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "#" &&
                location.pathname.startsWith(item.href))
            const Icon = item.icon

            if (item.isComingSoon) {
              return (
                <Button
                  key={item.name}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsPlannerModalOpen(true)
                  }}
                  className="relative h-auto min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Badge variant="outline" className="absolute top-1.5 right-1.5 h-4 px-1.5 text-[9px]">
                    {item.badge}
                  </Badge>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Button>
              )
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "relative flex flex-col items-center justify-center min-h-[72px] gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "bg-primary/10 border-primary/40 text-primary font-bold"
                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {item.badge && (
                  <Badge
                    variant={isActive ? "solid" : item.badgeVariant || "outline"}
                    className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1.5 text-[10px] font-mono"
                  >
                    {item.badge}
                  </Badge>
                )}
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs truncate max-w-[92px]">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-3 border-t border-border space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            if (item.onClick) {
              return (
                <Button
                  key={item.name}
                  type="button"
                  variant="ghost"
                  onClick={item.onClick}
                  className="w-full justify-start gap-2.5 px-3 h-11 lg:h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Button>
              )
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 h-11 lg:h-9 text-xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground font-medium hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom User Card */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            "p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors",
            location.pathname === "/profile"
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-muted/30"
          )}
        >
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card z-20 shrink-0 select-none">
        {navigationContent}
      </aside>

      {/* Mobile Drawer via Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 lg:hidden">
          {navigationContent}
        </SheetContent>
      </Sheet>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Compact Top Header */}
        <header className="h-14 lg:h-16 border-b border-border bg-card px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Labeled Menu Trigger (no bare hamburger) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden h-10 px-2.5 gap-1.5 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4" />
              <span className="text-xs font-semibold">Menu</span>
            </Button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <Link to="/dashboard" className="hidden sm:inline hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="hidden sm:inline">/</span>
              <span className="text-foreground font-bold truncate">{getActiveTitle()}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/reminders"
              aria-label="Pengingat"
              className="relative inline-flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Bell className="h-4 w-4" />
              {counts.urgentReminders > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>

            <Link
              to="/profile"
              aria-label="Profil Pengguna"
              className={cn(
                "inline-flex h-10 lg:h-9 items-center gap-2 rounded-lg border px-2 sm:px-2.5 text-xs font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                location.pathname === "/profile"
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[110px] truncate">
                {displayName.split(" ")[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content with Bottom Nav Clearance on Mobile */}
        <main className="flex-1 overflow-y-auto px-3 pt-4 pb-24 sm:px-5 sm:pt-5 lg:p-7 bg-background">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (44px+ touch targets, safe-area aware) */}
      <nav
        aria-label="Navigasi cepat mobile"
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm px-2 pt-1.5 pb-safe"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {mobileBottomItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center min-h-[48px] rounded-lg px-1 py-1 text-[10px] font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-4 w-4 mb-0.5" />
                  {item.count > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                      {item.count > 9 ? "9+" : item.count}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full">{item.name}</span>
              </Link>
            )
          })}

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(true)}
            className="h-auto min-h-[48px] flex-col justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Menu lainnya"
          >
            <Menu className="h-4 w-4" />
            <span>Lainnya</span>
          </Button>
        </div>
      </nav>

      {/* Planner Coming Soon Dialog */}
      <Dialog open={isPlannerModalOpen} onOpenChange={setIsPlannerModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Planner (Segera)</DialogTitle>
            <DialogDescription>
              Modul jadwal pengadaan, reservasi aset, dan kalender operasional sedang dalam pengembangan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsPlannerModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Panduan Singkat</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Package className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Inventaris</p>
                <p>Kelola katalog aset, stok, dan kondisi dalam mode grid atau tabel.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <ArrowLeftRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Peminjaman</p>
                <p>Tinjau pengajuan, pantau jatuh tempo, dan verifikasi pengembalian.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Bell className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Pengingat</p>
                <p>Pantau jadwal servis aset, garansi, dan perpanjangan lisensi.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsHelpModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
