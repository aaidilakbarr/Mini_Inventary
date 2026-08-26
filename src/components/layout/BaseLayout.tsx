import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  History, 
  Settings, 
  Search, 
  Plus, 
  User, 
  ChevronRight,
  Sparkles,
  ExternalLink
} from "lucide-react"
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
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Inventory", href: "/inventory", icon: Package, badge: "2,345" },
      { name: "Borrowing", href: "/borrowing", icon: ArrowLeftRight, badge: "3 Pending", badgeVariant: "secondary" },
    ]
  },
  {
    title: "Operations & Alerts",
    items: [
      { name: "Subscriptions", href: "/subscriptions", icon: CreditCard, badge: "24 Active" },
      { name: "Reminders", href: "/reminders", icon: Bell, badge: "5 Due", badgeVariant: "destructive" },
    ]
  },
  {
    title: "Administration",
    items: [
      { name: "Audit Logs", href: "/audit-logs", icon: History },
      { name: "System Settings", href: "/settings", icon: Settings },
    ]
  }
]

export function BaseLayout() {
  const location = useLocation()
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "staff">("admin")
  const [searchQuery, setSearchQuery] = useState("")

  const activeItem = navSections
    .flatMap((s) => s.items)
    .find((item) => location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href)))

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/80 bg-card/95 backdrop-blur-md flex flex-col">
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
              <p className="text-[11px] text-muted-foreground leading-tight">Asset & Reminder System</p>
            </div>
          </Link>
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

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
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
                      {item.badge && (
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
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Role Switcher */}
        <div className="p-3 border-t border-border/60 bg-muted/30">
          <div className="p-2.5 rounded-lg border border-border/80 bg-card shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-foreground leading-tight truncate">Aidil Pratama</p>
                  <p className="text-[10px] text-muted-foreground truncate">aidil@example.com</p>
                </div>
              </div>
              <Badge variant={currentUserRole === "admin" ? "default" : "secondary"} className="text-[9px] uppercase px-1.5 py-0 h-4 font-mono font-bold">
                {currentUserRole}
              </Badge>
            </div>

            {/* Quick role preview switch */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
              <span className="text-muted-foreground text-[10px]">Preview Role:</span>
              <div className="inline-flex rounded-md bg-muted p-0.5">
                <button
                  onClick={() => setCurrentUserRole("admin")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded font-medium transition-all",
                    currentUserRole === "admin" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Admin
                </button>
                <button
                  onClick={() => setCurrentUserRole("staff")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded font-medium transition-all",
                    currentUserRole === "staff" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="h-16 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between gap-4">
          {/* Breadcrumbs & Active Page */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Application</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:inline" />
            <h1 className="text-sm font-semibold text-foreground truncate">
              {activeItem?.name || "Dashboard"}
            </h1>
            <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-border/60">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-muted-foreground">Supabase Connected</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative w-48 lg:w-72 hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search inventory, code, borrower..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-12 h-8 text-xs bg-muted/40 border-border/80 focus-visible:bg-background"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 py-0.5 bg-background border border-border/80 rounded text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            {/* Quick Action Button */}
            <Link to="/inventory">
              <Button size="sm" className="h-8 text-xs font-medium gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-3.5 w-3.5" />
                <span>New Asset</span>
              </Button>
            </Link>

            {/* Notification Bell with Ping */}
            <Link to="/reminders" className="relative p-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-card">
                5
              </span>
            </Link>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet context={{ currentUserRole }} />
        </main>
      </div>
    </div>
  )
}
