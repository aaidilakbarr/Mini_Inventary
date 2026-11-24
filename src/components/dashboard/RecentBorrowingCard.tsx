import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Clock, User, ChevronLeft, ChevronRight, Package, Eye, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateID } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { BorrowingItem } from "@/types/database"

interface RecentBorrowingCardProps {
  borrowings: BorrowingItem[]
  onViewDetail: (item: BorrowingItem) => void
  isAdmin?: boolean
}

export function RecentBorrowingCard({ borrowings, onViewDetail }: RecentBorrowingCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const sortedBorrowings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return [...borrowings].sort((a, b) => {
      const aIsOverdue = a.status === "Borrowed" && new Date(a.due_date) < today
      const bIsOverdue = b.status === "Borrowed" && new Date(b.due_date) < today
      if (aIsOverdue && !bIsOverdue) return -1
      if (!aIsOverdue && bIsOverdue) return 1

      const aIsPending = a.status === "Pending Approval"
      const bIsPending = b.status === "Pending Approval"
      if (aIsPending && !bIsPending) return -1
      if (!aIsPending && bIsPending) return 1

      const aIsBorrowed = a.status === "Borrowed"
      const bIsBorrowed = b.status === "Borrowed"
      if (aIsBorrowed && !bIsBorrowed) return -1
      if (!aIsBorrowed && bIsBorrowed) return 1

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [borrowings])

  const activeItem = sortedBorrowings[currentIndex] || null
  const totalItems = sortedBorrowings.length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDueDelta = (item: BorrowingItem) => {
    if (item.status !== "Borrowed" || !item.due_date) return null
    const due = new Date(item.due_date)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: `Terlambat ${Math.abs(diffDays)} hr`, overdue: true }
    if (diffDays === 0) return { label: "Hari ini", overdue: false }
    return { label: `H-${diffDays}`, overdue: false }
  }

  const isOverdue = activeItem?.status === "Borrowed" && new Date(activeItem.due_date) < today
  const dueDelta = activeItem ? getDueDelta(activeItem) : null

  const renderStatusBadge = (item: BorrowingItem) => {
    const itemOverdue = item.status === "Borrowed" && new Date(item.due_date) < today
    if (itemOverdue) return <Badge variant="destructive">Terlambat</Badge>
    if (item.status === "Pending Approval") return <Badge variant="warning">Menunggu</Badge>
    if (item.status === "Borrowed") return <Badge variant="info">Dipinjam</Badge>
    if (item.status === "Returned") return <Badge variant="success">Dikembalikan</Badge>
    return <Badge variant="secondary">{item.status}</Badge>
  }

  const queueItems = sortedBorrowings.slice(0, 3)

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Peminjaman</CardTitle>
            {totalItems > 1 ? (
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))}
                  aria-label="Peminjaman sebelumnya"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-mono text-muted-foreground px-1 tabular-nums">
                  {currentIndex + 1}/{totalItems}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))}
                  aria-label="Peminjaman berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Link to="/borrowing" className="text-xs font-semibold text-primary hover:underline">
                Semua
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5">
          {!activeItem ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              Belum ada peminjaman.
            </div>
          ) : (
            <>
              {/* Highlighted Priority Record */}
              <div
                className={cn(
                  "p-3 rounded-xl border space-y-3 transition-colors",
                  isOverdue
                    ? "border-destructive/40 bg-destructive/5"
                    : activeItem.status === "Pending Approval"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {activeItem.inventory?.photo_url ? (
                        <img
                          src={activeItem.inventory.photo_url}
                          alt={activeItem.inventory.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {activeItem.inventory?.name || "Aset"}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {activeItem.inventory?.code || "-"}
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge(activeItem)}
                </div>

                <div className="space-y-1.5 pt-2.5 border-t border-border/70 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Peminjam
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[130px]">
                      {activeItem.borrower?.full_name || "Staf"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Pinjam
                    </span>
                    <span className="font-mono text-[11px] text-foreground">
                      {formatDateID(activeItem.request_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Tenggat
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isOverdue ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {formatDateID(activeItem.due_date)}
                      </span>
                      {dueDelta && (
                        <Badge variant={dueDelta.overdue ? "destructive" : "secondary"} className="h-4 px-1.5 text-[10px]">
                          {dueDelta.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(activeItem)}
                className="w-full"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Lihat Detail</span>
              </Button>

              {/* Compact Queue Switcher (Real next records) */}
              {queueItems.length > 1 && (
                <div className="pt-2 border-t border-border space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Prioritas Teratas
                  </span>
                  <div className="space-y-1">
                    {queueItems.map((qItem, idx) => (
                      <Button
                        key={qItem.id}
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          "w-full h-auto justify-between gap-2 px-2.5 py-2 text-xs font-normal rounded-lg",
                          idx === currentIndex
                            ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <span className="truncate">{qItem.inventory?.name || "Aset"}</span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {qItem.borrower?.full_name?.split(" ")[0] || "Staf"}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>

      {totalItems > 1 && (
        <div className="px-4 sm:px-5 pb-4 pt-0">
          <Link
            to="/borrowing"
            className="block text-center text-xs font-semibold text-primary hover:underline py-1"
          >
            Semua peminjaman
          </Link>
        </div>
      )}
    </Card>
  )
}
