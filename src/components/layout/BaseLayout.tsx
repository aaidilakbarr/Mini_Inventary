import { useState, useEffect } from "react"
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

const navSections: NavSection[] = [
  {
    title: "Menu Utama",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Inventaris", href: "/inventory", icon: Package, badge: "2.345" },
      { name: "Peminjaman", href: "/borrowing", icon: ArrowLeftRight, badge: "3 Menunggu", badgeVariant: "secondary" },
    ]
  },
  {
    title: "Operasi & Pengingat",
    items: [
      { name: "Langganan", href: "/subscriptions", icon: CreditCard, badge: "24 Aktif" },
      { name: "Pengingat", href: "/reminders", icon: Bell, badge: "5 Jatuh Tempo", badgeVariant: "destructive" },
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

export function BaseLayout() {
  const location = useLocation()
  const { user, profile, role, isAdmin, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false)

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpenMobile(false)
  }, [location.pathname])

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
                            ? "bg-primary-foreground/20 text-primary-foreground"
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
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 border-r border-border/80 bg-card/95 backdrop-blur-md flex-col">
        {navigationContent}
      </aside>

      {/* Mobile / Tablet Drawer (Slide-over) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative z-50 w-[280px] sm:w-80 max-w-[85vw] bg-card border-r border-border shadow-2xl h-full flex flex-col transform transition-transform duration-200 ease-in-out">
            {navigationContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Sticky Header */}
        <header className="h-16 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Mobile Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Buka menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Aplikasi</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:inline shrink-0" />
              <h1 className="text-sm font-semibold text-foreground truncate">
                {activeItem?.name || "Dashboard"}
              </h1>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 ml-3 pl-3 border-l border-border/60">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-muted-foreground">Supabase Terhubung</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop / Tablet Search Bar */}
            <div className="relative w-40 md:w-60 lg:w-72 hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari apa saja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-10 h-8 text-xs bg-muted/40 border-border/80 focus-visible:bg-background"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 py-0.5 bg-background border border-border/80 rounded text-muted-foreground hidden md:inline-block">
                ⌘K
              </kbd>
            </div>

            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              className="sm:hidden p-2 rounded-lg border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cari"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Quick Action Button */}
            <Link to="/inventory">
              <Button size="sm" className="h-8 text-xs font-medium gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 sm:px-3">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aset Baru</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </Link>

            {/* Notification Bell with Ping */}
            <Link to="/reminders" className="relative p-2 rounded-lg border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-card">
                5
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Search Bar Dropdown */}
        {isSearchOpenMobile && (
          <div className="sm:hidden p-3 bg-card border-b border-border/80 animate-in slide-in-from-top-2 duration-150">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                autoFocus
                placeholder="Cari inventaris, kode, peminjam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-9 text-xs bg-muted/40 border-border/80 w-full"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Page Body Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet context={{ currentUserRole: role, isAdmin }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md screens) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link 
          to="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            location.pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>Beranda</span>
        </Link>
        <Link 
          to="/inventory"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            location.pathname.startsWith("/inventory") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="h-4 w-4 mb-0.5" />
          <span>Inventaris</span>
        </Link>
        <Link 
          to="/borrowing"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            location.pathname.startsWith("/borrowing") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowLeftRight className="h-4 w-4 mb-0.5" />
          <span>Pinjam</span>
        </Link>
        <Link 
          to="/reminders"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative",
            location.pathname.startsWith("/reminders") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Bell className="h-4 w-4 mb-0.5" />
            <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-destructive" />
          </div>
          <span>Pengingat</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-4 w-4 mb-0.5" />
          <span>Lainnya</span>
        </button>
      </nav>
    </div>
  )
}
