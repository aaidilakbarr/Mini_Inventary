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
  Lock,
  CalendarDays,
  HelpCircle,
  Mail,
  Sparkles,
  Info
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

interface BentoNavCard {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  isComingSoon?: boolean
  adminOnly?: boolean
}

interface ListNavItem {
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

  // Real badge counts state
  const [counts, setCounts] = useState<{
    inventories: number
    pendingBorrowings: number
    activeBorrowings: number
    activeSubscriptions: number
    urgentReminders: number
  }>({
    inventories: 0,
    pendingBorrowings: 0,
    activeBorrowings: 0,
    activeSubscriptions: 0,
    urgentReminders: 0,
  })

  const loadCounts = useCallback(async () => {
    try {
      const [invRes, pendingBorrowRes, activeBorrowRes, subRes, reminderRes] = await Promise.all([
        supabase.from('inventories').select('id', { count: 'exact', head: true }),
        supabase.from('borrowings').select('id', { count: 'exact', head: true }).eq('status', 'Pending Approval'),
        supabase.from('borrowings').select('id', { count: 'exact', head: true }).eq('status', 'Borrowed'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('reminders').select('id', { count: 'exact', head: true }).neq('status', 'Completed'),
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

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // 6 Bento Cards (2 columns x 3 rows) matching Stockly reference & user requirements
  const bentoNavItems: BentoNavCard[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Inventaris", 
      href: "/inventory", 
      icon: Package, 
      badge: counts.inventories > 0 ? `${counts.inventories}` : undefined 
    },
    { 
      name: "Peminjaman", 
      href: "/borrowing", 
      icon: ArrowLeftRight, 
      badge: counts.pendingBorrowings > 0 
        ? `${counts.pendingBorrowings}` 
        : counts.activeBorrowings > 0 
        ? `${counts.activeBorrowings}` 
        : undefined, 
      badgeVariant: counts.pendingBorrowings > 0 ? "secondary" : "default" 
    },
    { 
      name: "Langganan", 
      href: "/subscriptions", 
      icon: CreditCard, 
      badge: counts.activeSubscriptions > 0 ? `${counts.activeSubscriptions}` : undefined 
    },
    { 
      name: "Pengingat", 
      href: "/reminders", 
      icon: Bell, 
      badge: counts.urgentReminders > 0 ? `${counts.urgentReminders}` : undefined, 
      badgeVariant: "destructive" 
    },
    { 
      name: "Planner", 
      href: "#", 
      icon: CalendarDays, 
      badge: "Segera",
      badgeVariant: "outline",
      isComingSoon: true 
    },
  ]

  // Secondary list navigation below the bento cards
  const secondaryNavItems: ListNavItem[] = [
    { 
      name: "Log Audit", 
      href: "/audit-logs", 
      icon: History, 
      adminOnly: true 
    },
    { 
      name: "Pengaturan Sistem", 
      href: "/settings", 
      icon: Settings, 
      adminOnly: true 
    },
    { 
      name: "Bantuan & FAQ", 
      href: "#", 
      icon: HelpCircle,
      onClick: () => setIsHelpModalOpen(true)
    },
  ]

  // Filter bento items by search term in sidebar
  const filteredBento = bentoNavItems.filter((item) => 
    item.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  )

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Pengguna"
  const displayEmail = profile?.email || user?.email || ""

  // Active page name for breadcrumbs
  const getActiveTitle = () => {
    if (location.pathname === "/dashboard") return "Dashboard"
    if (location.pathname.startsWith("/inventory")) return "Inventaris"
    if (location.pathname.startsWith("/borrowing")) return "Peminjaman"
    if (location.pathname.startsWith("/subscriptions")) return "Langganan"
    if (location.pathname.startsWith("/reminders")) return "Pengingat"
    if (location.pathname.startsWith("/audit-logs")) return "Log Audit"
    if (location.pathname.startsWith("/settings")) return "Pengaturan"
    return "Halaman"
  }

  const navigationContent = (
    <div className="flex flex-col h-full bg-[#FAFCFE] dark:bg-card">
      {/* Brand Header - Stockly Style */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border/50">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
            <Package className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
              Stockly
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-primary/10 text-primary rounded-full border border-primary/20">
                PRO
              </span>
            </span>
          </div>
        </Link>
        {/* Close Button for Mobile Drawer */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Tutup menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Sidebar Inset Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/80" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-muted/50 border border-slate-200/80 dark:border-border/60 placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
          {sidebarSearch && (
            <button
              onClick={() => setSidebarSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Bento Grid Navigation (2 Columns) */}
        <div>
          <div className="grid grid-cols-2 gap-2.5">
            {filteredBento.map((item) => {
              const isActive = 
                location.pathname === item.href || 
                (item.href !== "/dashboard" && item.href !== "#" && location.pathname.startsWith(item.href))
              const Icon = item.icon

              if (item.isComingSoon) {
                return (
                  <button
                    key={item.name}
                    onClick={() => setIsPlannerModalOpen(true)}
                    className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-border/80 bg-card hover:bg-muted/40 hover:border-primary/30 transition-all duration-150 text-center group cursor-pointer"
                  >
                    <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold">
                      {item.badge}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground/70 mb-1.5 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 text-center group shadow-2xs",
                    isActive
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs shadow-primary/10"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-muted/50 hover:border-border"
                  )}
                >
                  {/* Badge Counter */}
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : item.badgeVariant === "destructive"
                          ? "bg-destructive/15 text-destructive font-semibold"
                          : item.badgeVariant === "secondary"
                          ? "bg-amber-500/15 text-amber-600 font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  <Icon
                    className={cn(
                      "h-5 w-5 mb-1.5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors truncate max-w-[90px]",
                      isActive ? "text-primary font-bold" : "font-medium"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Secondary List Navigation */}
        <div className="pt-2 border-t border-border/50 space-y-1">
          <p className="px-2 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
            Lainnya
          </p>
          {secondaryNavItems.map((item) => {
            const isLocked = item.adminOnly && !isAdmin
            const isActive = location.pathname === item.href
            const Icon = item.icon

            if (item.onClick) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted/60 hover:text-foreground transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                    : isLocked
                    ? "text-muted-foreground/50 hover:bg-muted/40 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{item.name}</span>
                </div>
                {isLocked && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Admin</span>
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Floating User Profile Card at Sidebar Bottom */}
      <div className="p-3 border-t border-border/50 bg-slate-50/50 dark:bg-card">
        <div className="p-2.5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <button
            type="button"
            onClick={() => signOut()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            title="Keluar Akun"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-[#F4F7FB] dark:bg-background text-foreground overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 dark:border-border/80 bg-[#FAFCFE] dark:bg-card z-20 shrink-0 select-none">
        {navigationContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#FAFCFE] dark:bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navigationContent}
      </div>

      {/* Main App Layout */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar - Stockly Breadcrumb & Actions */}
        <header className="h-16 border-b border-slate-200/80 dark:border-border/80 bg-white/80 dark:bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl border-border/80 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4 text-foreground" />
            </Button>

            {/* Minimalist Breadcrumb: Home / [Halaman Aktif] */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-foreground font-bold">
                {getActiveTitle()}
              </span>
            </div>
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell with live count */}
            <Link to="/reminders">
              <button
                className="relative h-9 w-9 rounded-xl border border-slate-200/80 dark:border-border/80 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                aria-label="Notifikasi Pengingat"
                title="Notifikasi Pengingat"
              >
                <Bell className="h-4 w-4" />
                {counts.urgentReminders > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </Link>

            {/* Help / Mail Pill Button */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-border/80 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              aria-label="Bantuan dan Panduan"
              title="Bantuan & Panduan"
            >
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F4F7FB] dark:bg-background">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Planner Coming Soon Dialog */}
      <Dialog open={isPlannerModalOpen} onOpenChange={setIsPlannerModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">Fitur Planner Segera Hadir</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modul perencanaan cerdas untuk jadwal pengadaan aset, alokasi inventaris bertahap, dan kalender operasional terpadu sedang dalam tahap pengembangan.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/40 border border-border/80 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Info className="h-4 w-4 text-primary" />
              <span>Agenda Pengembangan:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Timeline peminjaman & reservasi aset otomatis</li>
              <li>Kalender jatuh tempo langganan & garansi</li>
              <li>Integrasi notifikasi tugas dan persetujuan pengadaan</li>
            </ul>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsPlannerModalOpen(false)} className="rounded-xl h-8 text-xs">
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & FAQ Dialog */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mb-2">
              <HelpCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">Pusat Bantuan & Panduan</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Panduan ringkas penggunaan sistem manajemen inventaris Stockly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1 text-xs text-muted-foreground">
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <p className="font-semibold text-foreground mb-0.5">📦 Manajemen Inventaris</p>
              <p>Kelola katalog barang, pantau status stok (Tersedia, Dipinjam, Menipis), dan beralih antara tampilan Grid Card atau Tabel.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <p className="font-semibold text-foreground mb-0.5">🔄 Peminjaman & Pengembalian</p>
              <p>Setujui pengajuan peminjaman dari staf atau pengguna serta catat kondisi aset saat dikembalikan.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <p className="font-semibold text-foreground mb-0.5">🔔 Pengingat & Jatuh Tempo</p>
              <p>Sistem akan memunculkan indikator peringatan saat mendekati masa tenggang peminjaman atau perpanjangan lisensi.</p>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsHelpModalOpen(false)} className="rounded-xl h-8 text-xs">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
