import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Loader2, 
  PackageOpen, 
  Eye, 
  LayoutGrid, 
  List, 
  Tag, 
  Scan,
  ArrowLeftRight,
  CheckCircle2
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InventoryCard } from "@/components/inventory/InventoryCard"
import { InventoryModal } from "@/components/modals/InventoryModal"
import { InventoryDetailModal } from "@/components/modals/InventoryDetailModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { BorrowingModal } from "@/components/modals/BorrowingModal"
import { fetchInventories, createInventory, updateInventory, deleteInventory } from "@/lib/api/inventories"
import { fetchCategories, createCategory } from "@/lib/api/categories"
import { fetchProfiles } from "@/lib/api/profiles"
import { createBorrowing } from "@/lib/api/borrowings"
import { useAuth } from "@/hooks/useAuth"
import type { InventoryItem, CreateInventoryPayload, Category, CreateBorrowingPayload } from "@/types/database"
import type { UserProfile } from "@/types/auth"

export function InventoryPage() {
  const { user, isAdmin } = useAuth()
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Semua")
  const [sortBy, setSortBy] = useState<"newest" | "name" | "quantity" | "status">("newest")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid") // Default Grid Card view as requested

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Detail modal state
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Borrowing modal state
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [borrowTargetItem, setBorrowTargetItem] = useState<InventoryItem | null>(null)
  const [borrowSuccessMessage, setBorrowSuccessMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [invData, catData, profData] = await Promise.all([
        fetchInventories(),
        fetchCategories('inventory'),
        fetchProfiles(),
      ])
      setInventories(invData)
      setCategories(catData)
      setProfiles(profData)
    } catch (err) {
      console.error("Gagal memuat data inventaris:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenDetail = (item: InventoryItem) => {
    setDetailItem(item)
    setIsDetailModalOpen(true)
  }

  const handleOpenBorrow = (item: InventoryItem) => {
    setBorrowTargetItem(item)
    setIsBorrowModalOpen(true)
  }

  const handleCreateBorrowing = async (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => {
    if (Array.isArray(payload)) {
      for (const item of payload) {
        await createBorrowing(item)
      }
    } else {
      await createBorrowing(payload)
    }
    setBorrowSuccessMessage(
      isAdmin 
        ? "Catatan peminjaman aset berhasil disimpan!" 
        : "Permohonan peminjaman aset berhasil diajukan dan sedang menunggu persetujuan Admin."
    )
    setTimeout(() => setBorrowSuccessMessage(null), 5000)
    await loadData()
  }

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item: InventoryItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (payload: CreateInventoryPayload) => {
    if (editingItem) {
      await updateInventory(editingItem.id, payload)
    } else {
      await createInventory(payload)
    }
    await loadData()
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteInventory(deletingItem.id)
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      await loadData()
    } catch (err) {
      console.error("Gagal menghapus aset:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddCategory = async (name: string, type: 'inventory' | 'subscription' | 'general', description?: string) => {
    await createCategory(name, type, description)
    await loadData()
  }

  const exportCSV = () => {
    if (inventories.length === 0) return
    const headers = ["Kode Aset", "Nama Barang", "Kategori", "Lokasi", "Jumlah", "Kondisi", "Garansi", "Status", "Pemasok"]
    const rows = inventories.map(i => [
      `"${i.code}"`,
      `"${i.name}"`,
      `"${i.category?.name || '-'}"`,
      `"${i.location || '-'}"`,
      i.quantity,
      `"${i.condition || '-'}"`,
      `"${i.warranty_info || '-'}"`,
      `"${i.status}"`,
      `"${i.supplier || '-'}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `inventaris_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = inventories.filter((item) => {
      const categoryName = item.category?.name || ""
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "Semua" || categoryName === categoryFilter
      return matchesSearch && matchesCategory
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "quantity") {
        return b.quantity - a.quantity
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status)
      }
      // "newest" by default
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
    })

    return result
  }, [inventories, searchTerm, categoryFilter, sortBy])

  // Summary Metrics calculations
  const totalQuantity = useMemo(() => {
    return inventories.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
  }, [inventories])

  const totalAvailable = useMemo(() => {
    return inventories.filter(item => item.status === "Available").length
  }, [inventories])

  const availableInventories = useMemo(() => {
    return inventories.filter(item => item.status === "Available" && (Number(item.quantity) || 0) > 0)
  }, [inventories])

  const categoryNames = ["Semua", ...Array.from(new Set(categories.map(c => c.name)))]

  return (
    <div className="space-y-6">
      {/* Hero Header Section - Stockly Design Pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Semua Barang Inventaris
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola seluruh aset fisik, pantau status ketersediaan, dan catat riwayat lokasi secara real-time.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Button 1: Kelola Kategori */}
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
            >
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>Kelola Kategori</span>
            </Button>
          )}

          {/* Button 2: Ekspor CSV */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV}
            disabled={inventories.length === 0}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ekspor CSV</span>
          </Button>

          {/* Button 3: Tambah Aset (Primary dark/navy button) */}
          {isAdmin && (
            <Button 
              size="sm" 
              onClick={handleOpenAdd}
              className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Tambah Aset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Borrowing Success Feedback Alert */}
      {borrowSuccessMessage && (
        <div className="p-3.5 text-xs rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{borrowSuccessMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBorrowSuccessMessage(null)}
            className="h-6 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-lg"
          >
            Tutup
          </Button>
        </div>
      )}

      {/* Filter, Search & View Mode Switcher Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Pill Search Input with Scan Icon */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode, nama barang, lokasi, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-xs rounded-xl bg-slate-100/70 dark:bg-muted/40 border border-slate-200/70 dark:border-border/60 placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer" title="Pindai Barcode / QR">
              <Scan className="h-4 w-4" />
            </div>
          </div>

          {/* Right Controls: Sort Dropdown & Grid/Table Switcher */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground hidden sm:inline">Urutkan:</span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border/80 bg-background">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="name">Nama (A-Z)</SelectItem>
                  <SelectItem value="quantity">Kuantitas</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Switcher: Grid vs Table */}
            <div className="flex items-center p-0.5 rounded-xl border border-slate-200/80 dark:border-border bg-slate-100/80 dark:bg-muted/50">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-card text-foreground font-semibold shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tampilan Grid Card"
                aria-label="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  viewMode === "table" 
                    ? "bg-white dark:bg-card text-foreground font-semibold shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tampilan Tabel Rinci"
                aria-label="Table View"
              >
                <List className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips & Live Counters Row */}
        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "bg-slate-100 dark:bg-muted text-muted-foreground hover:text-foreground hover:bg-slate-200/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Inline Summary Metrics */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono shrink-0">
            <span>
              Kategori: <strong className="text-foreground">{categories.length}</strong>
            </span>
            <span>•</span>
            <span>
              Total Aset: <strong className="text-foreground">{inventories.length}</strong>
            </span>
            <span>•</span>
            <span>
              Kuantitas: <strong className="text-primary">{totalQuantity} Unit</strong>
            </span>
            <span>•</span>
            <span>
              Tersedia: <strong className="text-emerald-600">{totalAvailable}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Grid vs Table View */}
      {isLoading ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3 bg-card rounded-2xl border border-border/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Memuat katalog barang inventaris...</p>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3 bg-card rounded-2xl border border-border/80 text-center p-6">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <PackageOpen className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Tidak Ada Aset Ditemukan</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tidak ada barang yang cocok dengan filter pencarian atau kategori Anda.
          </p>
          {isAdmin && (
            <Button size="sm" onClick={handleOpenAdd} className="h-8 text-xs font-semibold rounded-xl mt-1">
              <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Aset Baru
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW (Default Stockly Style) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {processedItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onViewDetail={handleOpenDetail}
              onBorrow={handleOpenBorrow}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW (Refined Modern Data Table) */
        <Card className="border-border/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-0 overflow-x-auto">
            <Table className="min-w-[800px] w-full">
              <TableHeader className="bg-slate-50/80 dark:bg-muted/30">
                <TableRow className="border-border/60">
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Kode Aset</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Nama Barang</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Kategori</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Lokasi</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10 text-center">Jumlah</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Kondisi</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10">Status</TableHead>
                  <TableHead className="text-[11px] font-mono uppercase font-semibold h-10 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedItems.map((item) => (
                  <TableRow key={item.id} className="border-border/50 hover:bg-slate-50/60 dark:hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary py-3">
                      {item.code}
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="font-semibold text-xs text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.supplier || "Vendor internal"}</p>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] font-normal px-2.5 py-0.5 rounded-full border-border">
                        {item.category?.name || "Umum"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-foreground">
                      {item.location || "-"}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono font-bold text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {item.condition || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={
                          item.status === "Available" ? "default" :
                          item.status === "Borrowed" ? "secondary" :
                          item.status === "Maintenance" ? "destructive" : "outline"
                        }
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-full"
                      >
                        {item.status === "Available" ? "Tersedia" :
                         item.status === "Borrowed" ? "Dipinjam" :
                         item.status === "Maintenance" ? "Perawatan" :
                         item.status === "Lost" ? "Hilang" : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDetail(item)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Lihat Detail Aset"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={item.status !== "Available" || (item.quantity ?? 0) <= 0}
                          onClick={() => handleOpenBorrow(item)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 disabled:opacity-35"
                          title={
                            item.status !== "Available" || (item.quantity ?? 0) <= 0
                              ? "Aset tidak tersedia untuk dipinjam"
                              : "Pinjam Barang"
                          }
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenEdit(item)}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Aset"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDelete(item)}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Hapus Aset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add / Edit Inventory Modal */}
      <InventoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        categories={categories}
        onSubmit={handleSubmit}
      />

      {/* Inventory Detail Modal */}
      <InventoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
        isAdmin={isAdmin}
        onBorrow={handleOpenBorrow}
        onEdit={handleOpenEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Barang Inventaris"
        description={`Apakah Anda yakin ingin menghapus "${deletingItem?.name}" (${deletingItem?.code})? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleAddCategory}
      />

      {/* Borrowing Request Modal */}
      <BorrowingModal
        open={isBorrowModalOpen}
        onOpenChange={setIsBorrowModalOpen}
        availableInventories={availableInventories}
        profiles={profiles}
        currentUserId={user?.id || ""}
        isAdmin={isAdmin}
        initialInventoryId={borrowTargetItem?.id}
        onSubmit={handleCreateBorrowing}
      />
    </div>
  )
}
