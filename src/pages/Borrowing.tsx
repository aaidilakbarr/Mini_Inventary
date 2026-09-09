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
  FileText
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  deleteBorrowing 
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

  // Modal & action states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<BorrowingItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Return dialog state
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returningItem, setReturningItem] = useState<BorrowingItem | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Detail form modal state
  const [detailItem, setDetailItem] = useState<BorrowingItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleOpenDetailModal = (item: BorrowingItem) => {
    setDetailItem(item)
    setIsDetailModalOpen(true)
  }

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

  const handleCreateBorrowing = async (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => {
    if (Array.isArray(payload)) {
      for (const item of payload) {
        await createBorrowing(item)
      }
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
      console.error("Gagal menyetujui peminjaman:", err)
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
      console.error("Gagal menolak permohonan:", err)
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

  const getStatusBadge = (item: BorrowingItem) => {
    const overdue = isOverdue(item)
    if (overdue) {
      return {
        label: "Terlambat",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      }
    }

    switch (item.status) {
      case "Borrowed":
        return {
          label: "Dipinjam",
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        }
      case "Pending Approval":
        return {
          label: "Menunggu Persetujuan",
          className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        }
      case "Returned":
        return {
          label: "Dikembalikan",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        }
      case "Rejected":
        return {
          label: "Ditolak",
          className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
        }
      default:
        return {
          label: item.status,
          className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        }
    }
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
      console.error("Gagal memproses pengembalian aset:", err)
      setActionError(err.message || "Gagal memproses pengembalian aset.")
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
      console.error("Gagal menghapus log peminjaman:", err)
      setActionError(err.message || "Gagal menghapus log peminjaman.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter available inventories (status Available & quantity > 0)
  const availableInventories = inventories.filter(i => i.status === "Available" && (i.quantity || 0) > 0)

  // Check if item is overdue
  const isOverdue = (item: BorrowingItem) => {
    if (item.status !== "Borrowed") return false
    const due = new Date(item.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  const filtered = borrowings.filter((b) => {
    const assetName = b.inventory?.name || ""
    const assetCode = b.inventory?.code || ""
    const borrowerName = b.borrower?.full_name || ""
    const borrowerEmail = b.borrower?.email || ""

    const matchesSearch = 
      assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === "Menunggu Persetujuan") matchesStatus = b.status === "Pending Approval"
    else if (statusFilter === "Dipinjam") matchesStatus = b.status === "Borrowed" && !isOverdue(b)
    else if (statusFilter === "Terlambat") matchesStatus = isOverdue(b)
    else if (statusFilter === "Dikembalikan") matchesStatus = b.status === "Returned"
    else if (statusFilter === "Ditolak") matchesStatus = b.status === "Rejected"

    return matchesSearch && matchesStatus
  })

  const statusOptions = [
    "Semua",
    "Menunggu Persetujuan",
    "Dipinjam",
    "Terlambat",
    "Dikembalikan",
    "Ditolak"
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Peminjaman Aset</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola permintaan peminjaman, persetujuan, dan pelacakan pengembalian inventaris.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={isLoading}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs justify-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-sm justify-center"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Pinjam Aset</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActionError(null)} 
            className="h-6 px-2 text-xs text-destructive hover:bg-destructive/20"
          >
            Tutup
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari aset atau nama peminjam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="h-7 text-xs px-3 rounded-full shrink-0 whitespace-nowrap"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Borrowings Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Aset</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Peminjam</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tgl Pengajuan</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Batas Kembali</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">Memuat data peminjaman...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada data peminjaman</p>
                      <p className="text-[11px]">Belum ada data peminjaman atau sesuai filter yang dipilih.</p>
                      <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)} className="h-7 text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> Ajukan Peminjaman
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const overdue = isOverdue(item)
                  const isItemBusy = actionLoadingId === item.id

                  // Strict permission check for returning item
                  const isBorrower = Boolean(user?.id && item.borrower_id === user.id)
                  const canReturn = isAdmin || isBorrower

                  return (
                    <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="py-3">
                        <p className="font-medium text-xs text-foreground">{item.inventory?.name || "Aset Tidak Ditemukan"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{item.inventory?.code || "-"}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-medium text-xs text-foreground">{item.borrower?.full_name || "Tanpa Nama"}</p>
                        <p className="text-[10px] text-muted-foreground">{item.borrower?.email || "-"}</p>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                        {formatDateID(item.request_date)}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-mono">
                        <span className={overdue ? "text-destructive font-bold flex items-center gap-1" : "text-foreground"}>
                          {overdue && <AlertTriangle className="h-3 w-3 inline" />}
                          {formatDateID(item.due_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {(() => {
                          const badge = getStatusBadge(item)
                          return (
                            <span className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold select-none ${badge.className}`}>
                              {badge.label}
                            </span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "Pending Approval" ? (
                            isAdmin ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApprove(item)}
                                  disabled={isItemBusy}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 gap-1"
                                >
                                  {isItemBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  <span>Setujui</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleReject(item)}
                                  disabled={isItemBusy}
                                  className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 border-border/80 gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Tolak</span>
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border/60">
                                Menunggu Admin
                              </span>
                            )
                          ) : item.status === "Borrowed" ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDetailModal(item)}
                                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                                title="Lihat Formulir Peminjaman"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">Form</span>
                              </Button>
                              {canReturn ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleOpenReturnModal(item)}
                                  disabled={isItemBusy || isReturning}
                                  className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/30"
                                >
                                  {isItemBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                  <span>Kembalikan</span>
                                </Button>
                              ) : (
                                <span 
                                  className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded border border-border/40 select-none"
                                  title={`Aset dipinjam oleh ${item.borrower?.full_name || 'staf'}. Hanya peminjam atau Admin yang dapat memproses pengembalian.`}
                                >
                                  Dipinjam ({item.borrower?.full_name?.split(' ')[0] || 'User'})
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDetailModal(item)}
                                className="h-7 text-xs px-2.5 gap-1.5 border-border/80 hover:bg-muted text-foreground"
                                title="Lihat Formulir Peminjaman"
                              >
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                <span>Lihat Form</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setDeletingItem(item)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Hapus Riwayat"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Borrowing Request Modal */}
      <BorrowingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        availableInventories={availableInventories}
        profiles={profiles}
        currentUserId={user?.id || ""}
        isAdmin={isAdmin}
        onSubmit={handleCreateBorrowing}
      />

      {/* Return Confirmation Dialog */}
      <ReturnConfirmDialog
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
        item={returningItem}
        onConfirm={handleConfirmReturn}
        isLoading={isReturning}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Catatan Peminjaman"
        description="Apakah Anda yakin ingin menghapus catatan log peminjaman ini?"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Borrowing Detail Form Modal */}
      <BorrowingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
      />
    </div>
  )
}
