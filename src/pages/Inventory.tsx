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
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
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

const SORT_LABELS: Record<string, string> = {
  newest: "Terbaru",
  name: "Nama (A-Z)",
  quantity: "Kuantitas",
  status: "Status",
}

export function InventoryPage() {
  const { user, isAdmin } = useAuth()
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Semua")
  const [sortBy, setSortBy] = useState<"newest" | "name" | "quantity" | "status">("newest")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [borrowTargetItem, setBorrowTargetItem] = useState<InventoryItem | null>(null)
  const [borrowSuccessMessage, setBorrowSuccessMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [invData, catData, profData] = await Promise.all([
        fetchInventories(),
        fetchCategories("inventory"),
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
      isAdmin ? "Peminjaman berhasil dicatat." : "Permohonan peminjaman dikirim."
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

  const handleAddCategory = async (
    name: string,
    type: "inventory" | "subscription" | "general",
    description?: string
  ) => {
    await createCategory(name, type, description)
    await loadData()
  }

  const exportCSV = () => {
    if (inventories.length === 0) return
    const headers = ["Kode Aset", "Nama Barang", "Kategori", "Lokasi", "Jumlah", "Kondisi", "Garansi", "Status", "Pemasok"]
    const rows = inventories.map((i) => [
      `"${i.code}"`,
      `"${i.name}"`,
      `"${i.category?.name || "-"}"`,
      `"${i.location || "-"}"`,
      i.quantity,
      `"${i.condition || "-"}"`,
      `"${i.warranty_info || "-"}"`,
      `"${i.status}"`,
      `"${i.supplier || "-"}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `inventaris_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processedItems = useMemo(() => {
    const result = inventories.filter((item) => {
      const categoryName = item.category?.name || ""
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q) ||
        (item.supplier || "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "Semua" || categoryName === categoryFilter
      return matchesSearch && matchesCategory
    })

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "quantity") return b.quantity - a.quantity
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
    })

    return result
  }, [inventories, searchTerm, categoryFilter, sortBy])

  const availableInventories = useMemo(
    () => inventories.filter((item) => item.status === "Available" && (Number(item.quantity) || 0) > 0),
    [inventories]
  )

  const categoryNames = ["Semua", ...Array.from(new Set(categories.map((c) => c.name)))]

  const renderTableStatus = (status: string) => {
    if (status === "Available") return <Badge variant="success">Tersedia</Badge>
    if (status === "Borrowed") return <Badge variant="info">Dipinjam</Badge>
    if (status === "Maintenance") return <Badge variant="warning">Perawatan</Badge>
    if (status === "Lost") return <Badge variant="destructive">Hilang</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
            Inventaris
          </h1>
          <span className="text-xs font-mono text-muted-foreground">
            {processedItems.length} aset
          </span>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Kategori</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={inventories.length === 0}>
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ekspor</span>
            </Button>
            <Button size="sm" onClick={handleOpenAdd} className="col-span-2 sm:col-span-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Aset</span>
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {borrowSuccessMessage && (
        <Alert variant="success" className="items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{borrowSuccessMessage}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setBorrowSuccessMessage(null)}>
            Tutup
          </Button>
        </Alert>
      )}

      {/* Search, Sort & View Controls */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode, nama, lokasi, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-2">
            <Select value={sortBy} onValueChange={(val) => setSortBy((val as typeof sortBy) || "newest")}>
              <SelectTrigger size="sm" className="w-36" aria-label="Urutkan">
                <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="name">Nama (A-Z)</SelectItem>
                <SelectItem value="quantity">Kuantitas</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={viewMode} onValueChange={(val) => setViewMode((val as "grid" | "table") || "grid")}>
              <TabsList className="h-8">
                <TabsTrigger value="grid" className="px-2.5" aria-label="Tampilan Grid">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="px-2.5" aria-label="Tampilan Tabel">
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tabel</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="pt-2.5 border-t border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categoryNames.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={categoryFilter === cat ? "default" : "ghost"}
              size="xs"
              onClick={() => setCategoryFilter(cat)}
              className="rounded-full shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card className="h-64 flex flex-col items-center justify-center gap-2.5">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Memuat inventaris...</p>
        </Card>
      ) : processedItems.length === 0 ? (
        <Card className="h-64 flex flex-col items-center justify-center gap-2.5 text-center p-6">
          <PackageOpen className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">Belum ada aset yang cocok</p>
          {isAdmin && (
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Aset</span>
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <Card className="overflow-hidden">
          <Table className="min-w-[780px]">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 text-xs font-semibold text-muted-foreground">Kode</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Nama Barang</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Kategori</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Lokasi</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Unit</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Kondisi</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="px-4 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {item.code}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-xs text-foreground">{item.name}</p>
                    {item.supplier && (
                      <p className="text-[11px] text-muted-foreground">{item.supplier}</p>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline">{item.category?.name || "Umum"}</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-foreground">{item.location || "-"}</TableCell>
                  <TableCell className="py-3 text-xs font-mono font-semibold text-center tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {item.condition || "-"}
                  </TableCell>
                  <TableCell className="py-3">{renderTableStatus(item.status)}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenDetail(item)}
                        className="text-muted-foreground hover:text-primary"
                        title="Detail"
                        aria-label={`Detail ${item.name}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={item.status !== "Available" || (item.quantity ?? 0) <= 0}
                        onClick={() => handleOpenBorrow(item)}
                        className="text-muted-foreground hover:text-primary"
                        title="Pinjam"
                        aria-label={`Pinjam ${item.name}`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenEdit(item)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenDelete(item)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Hapus"
                            aria-label={`Hapus ${item.name}`}
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
        </Card>
      )}

      <InventoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <InventoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
        isAdmin={isAdmin}
        onBorrow={handleOpenBorrow}
        onEdit={handleOpenEdit}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Aset"
        description={`Hapus "${deletingItem?.name}" (${deletingItem?.code})? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleAddCategory}
      />

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
