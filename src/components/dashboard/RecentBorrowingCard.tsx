import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowLeftRight, Clock, User, ArrowRight, ChevronLeft, ChevronRight, Package, Eye } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateID } from "@/lib/formatters"
import type { BorrowingItem } from "@/types/database"

interface RecentBorrowingCardProps {
  borrowings: BorrowingItem[]
  onViewDetail: (item: BorrowingItem) => void
  isAdmin?: boolean
}

export function RecentBorrowingCard({ borrowings, onViewDetail }: RecentBorrowingCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Prioritise borrowings operationally:
  // 1. Overdue
  // 2. Pending Approval
  // 3. Active Borrowed
  // 4. Returned / other
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
  const isOverdue = activeItem?.status === "Borrowed" && new Date(activeItem.due_date) < today

  const getStatusBadge = (item: BorrowingItem) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Terlambat
        </Badge>
      )
    }
    if (item.status === "Pending Approval") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Menunggu
        </Badge>
      )
    }
    if (item.status === "Borrowed") {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Dipinjam
        </Badge>
      )
    }
    if (item.status === "Returned") {
      return (
        <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-600 border-emerald-300">
          Dikembalikan
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {item.status}
      </Badge>
    )
  }

  return (
    <Card className="h-full border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card rounded-2xl shadow-xs flex flex-col justify-between">
      <div>
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Peminjaman Terkini
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Transaksi prioritas operasional tertinggi
              </CardDescription>
            </div>

            {totalItems > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))}
                  title="Sebelumnya"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {currentIndex + 1}/{totalItems}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={() => setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))}
                  title="Berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-0">
          {!activeItem ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Belum ada riwayat transaksi peminjaman.
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Main Transaction Highlight Card */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isOverdue
                  ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20"
                  : activeItem.status === "Pending Approval"
                  ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20"
                  : "border-slate-200/90 dark:border-border/80 bg-slate-50/50 dark:bg-muted/30"
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
                      {activeItem.inventory?.photo_url ? (
                        <img
                          src={activeItem.inventory.photo_url}
                          alt={activeItem.inventory.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {activeItem.inventory?.name || "Nama Barang"}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        Kode: {activeItem.inventory?.code || "-"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(activeItem)}
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-border/60 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1 text-[11px]">
                      <User className="h-3 w-3 text-muted-foreground/80" />
                      Peminjam
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {activeItem.borrower?.full_name || "Staf / Pengguna"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-muted-foreground/80" />
                      Tenggat Waktu
                    </span>
                    <span className={`font-mono text-[11px] font-semibold ${
                      isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                    }`}>
                      {formatDateID(activeItem.due_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(activeItem)}
                  className="w-full h-8 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Lihat Detail</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 sm:p-5 pt-0">
        <Link to="/borrowing" className="block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-primary hover:bg-primary/5 gap-1 font-semibold justify-center cursor-pointer"
          >
            <span>Semua Transaksi Peminjaman</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
