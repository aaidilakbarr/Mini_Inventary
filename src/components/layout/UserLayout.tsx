import { useState, useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Package, ArrowLeftRight, CreditCard, Menu, LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/layout/NotificationBell"

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
    { name: "Inventaris", href: "/inventory", icon: Package },
    { name: "Peminjaman", href: "/borrowing", icon: ArrowLeftRight },
    { name: "Langganan", href: "/subscriptions", icon: CreditCard },
  ]

  const mobileBottomItems: UserNavItem[] = [
    ...navItems,
    { name: "Profil", href: "/profile", icon: User },
  ]

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna"
  const displayEmail = profile?.email || user?.email || ""

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-border bg-card px-3 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/inventory" className="flex items-center gap-2.5 z-10 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground transition-transform duration-150 group-hover:scale-105">
            <Package className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">Stockly</span>
        </Link>

        {/* Desktop Links */}
        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 h-9 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Notifications, User & Labeled Mobile Trigger */}
        <div className="flex items-center gap-2 z-10">
          <NotificationBell />

          <div
            className={cn(
              "hidden md:flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors",
              location.pathname === "/profile"
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            <Link
              to="/profile"
              className="flex items-center gap-2 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left truncate max-w-[130px]">
                <span className="text-xs font-semibold text-foreground leading-tight block truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none block truncate">
                  {displayEmail}
                </span>
              </div>
            </Link>

            <div className="h-4 w-px bg-border" />

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="md:hidden h-10 px-2.5 gap-1.5"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-4 w-4" />
            <span className="text-xs font-semibold">Menu</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="p-0 md:hidden flex flex-col">
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Package className="h-3.5 w-3.5" />
              </div>
              <span>Stockly</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-11 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-2">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate block">
                    {displayName}
                  </span>
                  <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content with Mobile Bottom Bar Clearance */}
      <main className="flex-1 px-3 pt-4 pb-24 sm:px-5 sm:pt-5 md:pb-7 lg:p-7 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi cepat mobile"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm px-2 pt-1.5 pb-safe"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {mobileBottomItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[48px] rounded-lg px-1 py-1 text-[10px] font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span className="truncate max-w-full">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
