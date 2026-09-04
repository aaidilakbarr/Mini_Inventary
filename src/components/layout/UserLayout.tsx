import { useState, useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { 
  Package, 
  ArrowLeftRight,
  CreditCard, 
  Menu, 
  X, 
  LogOut 
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UserNavItem {
  name: string
  href: string
  icon: React.ElementType
}

export function UserLayout() {
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const navItems: UserNavItem[] = [
    {
      name: "Inventaris",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "Peminjaman",
      href: "/borrowing",
      icon: ArrowLeftRight,
    },
    {
      name: "Langganan",
      href: "/subscriptions",
      icon: CreditCard,
    },
  ]

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Pengguna"
  const displayEmail = profile?.email || user?.email || ""

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-16 border-b border-border/70 bg-card/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        {/* Left: Brand */}
        <div className="flex items-center z-10">
          <Link to="/inventory" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight font-mono text-foreground block leading-tight">INV.HUB</span>
              <p className="text-[11px] text-muted-foreground hidden sm:block leading-tight">Manajemen Aset & Layanan</p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Section: User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 z-10">
          {/* User Profile Card */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-foreground leading-tight block">{displayName}</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none block">{displayEmail}</span>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="hidden sm:inline-flex h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </Button>

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9 border-border/80"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-border/70 bg-card px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile Profile & Logout */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground truncate block">{displayName}</span>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{displayEmail}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="h-7 text-[11px] text-destructive hover:bg-destructive/10 border-border/80 gap-1 shrink-0 ml-2"
            >
              <LogOut className="h-3 w-3" />
              <span>Keluar</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
