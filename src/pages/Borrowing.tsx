import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  Plus,
  Search,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Inbox,
  RefreshCw,
  Trash2,
  Check,
  X,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BorrowingModal } from "@/components/modals/BorrowingModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { ReturnConfirmDialog, type ReturnConfirmPayload } from "@/components/modals/ReturnConfirmDialog"
import { BorrowingDetailModal } from "@/components/modals/BorrowingDetailModal"
import {
  fetchBorrowings,
  createBorrowing,
  approveBorrowing,
  rejectBorrowing,
  returnBorrowing,
  deleteBorrowing,
} from "@/lib/api/borrowings"
import { fetchInventories } from "@/lib/api/inventories"
import { fetchProfiles } from "@/lib/api/profiles"
import { formatDateID } from "@/lib/formatters"
import type { BorrowingItem, InventoryItem, CreateBorrowingPayload } from "@/types/database"
import type { UserProfile } from "@/types/auth"

export function BorrowingPage() {
  const { user, isAdmin } = useAuth()
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([])
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [searchTerm, setSearchTerm] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<BorrowingItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returningItem, setReturningItem] = useState<BorrowingItem | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [detailItem, setDetailItem] = useState<BorrowingItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [borrowData, invData, profData] = await Promise.all([
        fetchBorrowings(),
        fetchInventories(),
        fetchProfiles(),
      ])
      setBorrowings(borrowData)
      setInventories(invData)
      setProfiles(profData)
    } catch (err) {
      console.error("Gagal memuat data peminjaman:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isOverdue = (item: BorrowingItem) => {
    if (item.status !== "Borrowed") return false
    const due = new Date(item.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  const handleCreateBorrowing = async (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => {
    if (Array.isArray(payload)) {
      for (const item of payload) await createBorrowing(item)
    } else {
      await createBorrowing(payload)
    }
    await loadData()
  }

  const handleApprove = async (item: BorrowingItem) => {
    try {
      setActionError(null)
      setActionLoadingId(item.id)
      await approveBorrowing(item.id, item.inventory_id)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Gagal menyetujui peminjaman.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (item: BorrowingItem) => {
    try {
      setActionError(null)
      setActionLoadingId(item.id)
      await rejectBorrowing(item.id)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Gagal menolak permohonan.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleOpenReturnModal = (item: BorrowingItem) => {
    setActionError(null)
    setReturningItem(item)
    setIsReturnDialogOpen(true)
  }

  const handleConfirmReturn = async (payload: ReturnConfirmPayload) => {
    if (!returningItem) return
    try {
      setIsReturning(true)
      setActionError(null)
      await returnBorrowing(returningItem.id, {
        condition: payload.condition,
        notes: payload.notes,
        currentUserId: user?.id,
        isAdmin,
      })
      setIsReturnDialogOpen(false)
      setReturningItem(null)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Gagal memproses pengembalian.")
    } finally {
      setIsReturning(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteBorrowing(deletingItem.id)
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Gagal menghapus catatan peminjaman.")
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStatusBadge = (item: BorrowingItem) => {
    if (isOverdue(item)) return <Badge variant="destructive">Terlambat</Badge>
    switch (item.status) {
      case "Borrowed":
        return <Badge variant="info">Dipinjam</Badge>
      case "Pending Approval":
        return <Badge variant="warning">Menunggu</Badge>
      case "Returned":
        return <Badge variant="success">Dikembalikan</Badge>
      case "Rejected":
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge variant="secondary">{item.status}</Badge>
    }
  }

  const availableInventories = inventories.filter((i) => i.status === "Available" && (i.quantity || 0) > 0)

  const filtered = borrowings.filter((b) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      (b.inventory?.name || "").toLowerCase().includes(q) ||
      (b.inventory?.code || "").toLowerCase().includes(q) ||
      (b.borrower?.full_name || "").toLowerCase().includes(q) ||
      (b.borrower?.email || "").toLowerCase().includes(q)

    let matchesStatus = true
    if (statusFilter === "Menunggu") matchesStatus = b.status === "Pending Approval"
    else if (statusFilter === "Dipinjam") matchesStatus = b.status === "Borrowed" && !isOverdue(b)
    else if (statusFilter === "Terlambat") matchesStatus = isOverdue(b)
    else if (statusFilter === "Dikembalikan") matchesStatus = b.status === "Returned"
    else if (statusFilter === "Ditolak") matchesStatus = b.status === "Rejected"

    return matchesSearch && matchesStatus
  })

  const statusOptions = ["Semua", "Menunggu", "Dipinjam", "Terlambat", "Dikembalikan", "Ditolak"]

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
            Peminjaman
          </h1>
          <span className="text-xs font-mono text-muted-foreground">{filtered.length} data</span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Pinjam Aset</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="destructive" className="items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setActionError(null)}>
            Tutup
          </Button>
        </Alert>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari aset atau peminjam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 sm:h-9"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val || "Semua")}>
            <TabsList className="w-full lg:w-fit overflow-x-auto justify-start">
              {statusOptions.map((status) => (
                <TabsTrigger key={status} value={status} className="flex-none">
                  {status}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Content: Desktop Table + Mobile Stacked Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs">Memuat peminjaman...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-6 text-center">
            <Inbox className="h-7 w-7 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">Belum ada data peminjaman</p>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Pinjam Aset</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table className="min-w-[780px]">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4 text-xs font-semibold text-muted-foreground">Aset</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Peminjam</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Pengajuan</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Batas Kembali</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const overdue = isOverdue(item)
                    const isItemBusy = actionLoadingId === item.id
                    const isBorrower = Boolean(user?.id && item.borrower_id === user.id)
                    const canReturn = isAdmin || isBorrower

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">
                          <p className="font-semibold text-xs text-foreground">
                            {item.inventory?.name || "Aset Tidak Ditemukan"}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {item.inventory?.code || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="font-medium text-xs text-foreground">
                            {item.borrower?.full_name || "Tanpa Nama"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.borrower?.email || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                          {formatDateID(item.request_date)}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono">
                          <span className={overdue ? "text-destructive font-bold inline-flex items-center gap-1" : "text-foreground"}>
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            {formatDateID(item.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">{renderStatusBadge(item)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === "Pending Approval" ? (
                              isAdmin ? (
                                <>
                                  <Button size="xs" onClick={() => handleApprove(item)} disabled={isItemBusy}>
                                    {isItemBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    <span>Setujui</span>
                                  </Button>
                                  <Button size="xs" variant="destructive-soft" onClick={() => handleReject(item)} disabled={isItemBusy}>
                                    <X className="h-3 w-3" />
                                    <span>Tolak</span>
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline">Menunggu Admin</Badge>
                              )
                            ) : item.status === "Borrowed" ? (
                              <>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => {
                                    setDetailItem(item)
                                    setIsDetailModalOpen(true)
                                  }}
                                >
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="hidden xl:inline">Form</span>
                                </Button>
                                {canReturn ? (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => handleOpenReturnModal(item)}
                                    disabled={isItemBusy || isReturning}
                                    className="text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
                                  >
                                    {isItemBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                    <span>Kembalikan</span>
                                  </Button>
                                ) : (
                                  <Badge variant="outline">
                                    {item.borrower?.full_name?.split(" ")[0] || "User"}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    setDetailItem(item)
                                    setIsDetailModalOpen(true)
                                  }}
                                >
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span>Form</span>
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => {
                                      setDeletingItem(item)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    aria-label="Hapus riwayat peminjaman"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Cards (Zero horizontal scroll, 44px touch targets) */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((item) => {
                const overdue = isOverdue(item)
                const isItemBusy = actionLoadingId === item.id
                const isBorrower = Boolean(user?.id && item.borrower_id === user.id)
                const canReturn = isAdmin || isBorrower

                return (
                  <div key={item.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                          {item.inventory?.name || "Aset Tidak Ditemukan"}
                        </p>
                        <p className="font-mono text-[11px] text-primary font-semibold">
                          {item.inventory?.code || "-"}
                        </p>
                      </div>
                      {renderStatusBadge(item)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 text-[11px]">
                      <div className="min-w-0">
                        <span className="text-muted-foreground block">Peminjam</span>
                        <span className="font-semibold text-foreground truncate block">
                          {item.borrower?.full_name || "Tanpa Nama"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block">Batas Kembali</span>
                        <span className={`font-mono font-semibold block ${overdue ? "text-destructive" : "text-foreground"}`}>
                          {formatDateID(item.due_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      {item.status === "Pending Approval" ? (
                        isAdmin ? (
                          <>
                            <Button size="sm" onClick={() => handleApprove(item)} disabled={isItemBusy} className="flex-1">
                              {isItemBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              <span>Setujui</span>
                            </Button>
                            <Button size="sm" variant="destructive-soft" onClick={() => handleReject(item)} disabled={isItemBusy} className="flex-1">
                              <X className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline">Menunggu persetujuan admin</Badge>
                        )
                      ) : item.status === "Borrowed" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDetailItem(item)
                              setIsDetailModalOpen(true)
                            }}
                            className="flex-1"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Form</span>
                          </Button>
                          {canReturn && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReturnModal(item)}
                              disabled={isItemBusy || isReturning}
                              className="flex-1"
                            >
                              {isItemBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                              <span>Kembalikan</span>
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDetailItem(item)
                              setIsDetailModalOpen(true)
                            }}
                            className="flex-1"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Lihat Form</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => {
                                setDeletingItem(item)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              aria-label="Hapus riwayat peminjaman"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <BorrowingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        availableInventories={availableInventories}
        profiles={profiles}
        currentUserId={user?.id || ""}
        isAdmin={isAdmin}
        onSubmit={handleCreateBorrowing}
      />

      <ReturnConfirmDialog
        open={isReturnDialogOpen}
        onOpenChange={(open) => {
          setIsReturnDialogOpen(open)
          if (!open) setActionError(null)
        }}
        item={returningItem}
        onConfirm={handleConfirmReturn}
        isLoading={isReturning}
        error={actionError}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Catatan Peminjaman"
        description="Hapus catatan peminjaman ini secara permanen?"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <BorrowingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
        onReturnClick={(item) => {
          setIsDetailModalOpen(false)
          handleOpenReturnModal(item)
        }}
        canReturn={Boolean(isAdmin || (user && detailItem?.borrower_id === user.id))}
      />
    </div>
  )
}
