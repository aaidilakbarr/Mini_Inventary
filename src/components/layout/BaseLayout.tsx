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
  Plus, 
  ChevronRight,
  Menu,
  X,
  LogOut,
  Shield,
  Lock
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function BaseLayout() {
  const location = useLocation()
  const { user, profile, role, isAdmin, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false)

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

  // Load sidebar counts on mount and route change
  useEffect(() => {
    loadCounts()
  }, [loadCounts, location.pathname])

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpenMobile(false)
  }, [location.pathname])

  // Dynamic Navigation items using live counts
  const navSections: NavSection[] = [
    {
      title: "Menu Utama",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
            ? `${counts.pendingBorrowings} Menunggu` 
            : counts.activeBorrowings > 0 
            ? `${counts.activeBorrowings} Dipinjam` 
            : undefined, 
          badgeVariant: counts.pendingBorrowings > 0 ? "secondary" : "default" 
        },
      ]
    },
    {
      title: "Operasi & Pengingat",
      items: [
        { 
          name: "Langganan", 
          href: "/subscriptions", 
          icon: CreditCard, 
          badge: counts.activeSubscriptions > 0 ? `${counts.activeSubscriptions} Aktif` : undefined 
        },
        { 
          name: "Pengingat", 
          href: "/reminders", 
          icon: Bell, 
          badge: counts.urgentReminders > 0 ? `${counts.urgentReminders}` : undefined, 
          badgeVariant: "destructive" 
        },
      ]
    },
    {
      title: "Administrasi",
      items: [
        { name: "Log Audit", href: "/audit-logs", icon: History, adminOnly: true },
        { name: "Pengaturan Sistem", href: "/settings", icon: Settings, adminOnly: true },
      ]
    }
  ]

  const activeItem = navSections
    .flatMap((s) => s.items)
    .find((item) => location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href)))

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Pengguna"
  const displayEmail = profile?.email || user?.email || ""

  const navigationContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border/60">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground font-mono">INV.HUB</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-primary/10 text-primary rounded-full border border-primary/20">v1.0</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">Manajemen Aset & Pengingat</p>
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

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = 
                  location.pathname === item.href || 
                  (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
                const Icon = item.icon
                const isLocked = item.adminOnly && !isAdmin

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 sm:py-2 text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.99]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                        : isLocked
                        ? "text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLocked && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50 flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                      {item.badge && !isLocked && (
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded-md leading-none tracking-tight",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                            : item.badgeVariant === "destructive"
                            ? "bg-destructive/15 text-destructive font-semibold"
                            : item.badgeVariant === "secondary"
                            ? "bg-amber-500/15 text-amber-600 font-semibold"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Card & Role / Sign Out */}
      <div className="p-3 border-t border-border/60 bg-muted/30">
        <div className="p-2.5 rounded-lg border border-border/80 bg-card shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
              </div>
            </div>
            <Badge 
              variant={isAdmin ? "default" : "secondary"} 
              className={cn(
                "text-[9px] uppercase px-1.5 py-0 h-4 font-mono font-bold shrink-0",
                isAdmin ? "bg-primary text-primary-foreground" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
              )}
            >
              {role}
            </Badge>
          </div>

          {/* User Actions: Role Indicator & Logout Button */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Shield className="h-3 w-3 text-primary" />
              <span>RBAC Aktif</span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive hover:text-destructive/80 px-2 py-0.5 rounded hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/80 bg-card z-20 shrink-0 select-none">
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
        "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navigationContent}
      </div>

      {/* Main App Layout */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border/80 bg-card px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden h-9 w-9 border-border/80 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4 text-foreground" />
            </Button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate font-medium">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-foreground font-semibold truncate">
                {activeItem ? activeItem.name : "Halaman"}
              </span>
            </div>
          </div>

          {/* Top Actions: Search, Quick Add & Mobile Search Toggle */}
          <div className="flex items-center gap-2">
            {/* Global Search on Desktop */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari aset, tiket, lisensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/40 border-border/80 focus:bg-background w-full"
              />
            </div>

            {/* Mobile Search Icon Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden h-8 w-8 border-border/80"
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              aria-label="Cari"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>

            {/* Quick Add Button */}
            <Link to="/inventory">
              <Button size="sm" className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aset Baru</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Search Bar Expansion */}
        {isSearchOpenMobile && (
          <div className="p-3 border-b border-border/80 bg-card md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari aset, tiket, lisensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-8 h-8 text-xs bg-muted/40 border-border/80 focus:bg-background w-full"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
