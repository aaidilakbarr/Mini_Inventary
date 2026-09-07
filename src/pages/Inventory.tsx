import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Search, 
  Download,
  Edit2,
  Trash2,
  Loader2,
  PackageOpen,
  RefreshCw,
  Eye
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { InventoryModal } from "@/components/modals/InventoryModal"
import { InventoryDetailModal } from "@/components/modals/InventoryDetailModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { fetchInventories, createInventory, updateInventory, deleteInventory } from "@/lib/api/inventories"
import { fetchCategories } from "@/lib/api/categories"
import { useAuth } from "@/hooks/useAuth"
import type { InventoryItem, CreateInventoryPayload, Category } from "@/types/database"

export function InventoryPage() {
  const { isAdmin } = useAuth()
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Semua")

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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [invData, catData] = await Promise.all([
        fetchInventories(),
        fetchCategories('inventory'),
      ])
      setInventories(invData)
      setCategories(catData)
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

  const filteredItems = inventories.filter((item) => {
    const categoryName = item.category?.name || ""
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "Semua" || categoryName === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Dynamic category options from DB
  const categoryNames = ["Semua", ...Array.from(new Set(categories.map(c => c.name)))]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Manajemen Inventaris</h1>
          <p className="text-xs text-muted-foreground">
            Lacak, kelola, dan katalog aset fisik serta perangkat keras perusahaan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={isLoading}
            className="h-8 text-xs font-medium gap-1.5 border-border/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV}
            disabled={inventories.length === 0}
            className="h-8 text-xs font-medium gap-1.5 border-border/80"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </Button>
          {isAdmin && (
            <Button 
              size="sm" 
              onClick={handleOpenAdd}
              className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Aset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan kode, model, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {categoryNames.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="h-7 text-xs px-2.5 rounded-md shrink-0 whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Inventory Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kode Aset</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Nama Barang / Model</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kategori</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Lokasi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-center">Jumlah</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Garansi</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">Memuat data inventaris...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <PackageOpen className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada aset ditemukan</p>
                      <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={handleOpenAdd} className="h-7 text-xs mt-1">
                          <Plus className="h-3 w-3 mr-1" /> Tambah Aset Pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary py-3">
                      {item.code}
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="font-medium text-xs text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.supplier || "Vendor internal"}</p>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-border/80">
                        {item.category?.name || "Umum"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-foreground">
                      {item.location || "-"}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono font-bold text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                      {item.warranty_info || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={
                          item.status === "Available" ? "default" :
                          item.status === "Borrowed" ? "secondary" :
                          item.status === "Maintenance" ? "destructive" : "outline"
                        }
                        className="text-[10px] font-mono px-2 py-0 h-5"
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
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Lihat Detail Aset"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenEdit(item)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Aset"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDelete(item)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Hapus Aset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Detail Inventory Modal */}
      <InventoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setDetailItem(null)
        }}
        item={detailItem}
        isAdmin={isAdmin}
        onEdit={(item) => {
          setIsDetailModalOpen(false)
          handleOpenEdit(item)
        }}
      />

      {/* Add / Edit Inventory Modal */}
      <InventoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        categories={categories}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Aset Inventaris"
        description={`Apakah Anda yakin ingin menghapus aset "${deletingItem?.name}" (${deletingItem?.code})? Data ini akan dihapus dari sistem.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
