import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  CreditCard, 
  RefreshCw 
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
import { SubscriptionModal } from "@/components/modals/SubscriptionModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { 
  fetchSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription 
} from "@/lib/api/subscriptions"
import { fetchCategories } from "@/lib/api/categories"
import type { SubscriptionItem, CreateSubscriptionPayload, Category } from "@/types/database"

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<SubscriptionItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subData, catData] = await Promise.all([
        fetchSubscriptions(),
        fetchCategories('subscription'),
      ])
      setSubscriptions(subData)
      setCategories(catData)
    } catch (err) {
      console.error("Gagal memuat data langganan:", err)
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

  const handleOpenEdit = (item: SubscriptionItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item: SubscriptionItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (payload: CreateSubscriptionPayload) => {
    if (editingItem) {
      await updateSubscription(editingItem.id, payload)
    } else {
      await createSubscription(payload)
    }
    await loadData()
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteSubscription(deletingItem.id)
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      await loadData()
    } catch (err) {
      console.error("Gagal menghapus langganan:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const service = sub.service_name.toLowerCase()
    const provider = (sub.provider || "").toLowerCase()
    const category = (sub.category?.name || "").toLowerCase()
    const search = searchTerm.toLowerCase()

    return service.includes(search) || provider.includes(search) || category.includes(search)
  })

  // Dynamic calculations
  const activeSubs = subscriptions.filter(s => s.status === 'Active')
  
  const totalMonthlySpend = activeSubs.reduce((acc, curr) => {
    const cost = Number(curr.cost) || 0
    if (curr.billing_cycle === 'Monthly') return acc + cost
    if (curr.billing_cycle === 'Quarterly') return acc + (cost / 3)
    if (curr.billing_cycle === 'Semi-Annually') return acc + (cost / 6)
    if (curr.billing_cycle === 'Yearly') return acc + (cost / 12)
    return acc + cost
  }, 0)

  // Upcoming renewals in next 7 days
  const now = new Date()
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(now.getDate() + 7)

  const upcomingRenewals = activeSubs.filter(s => {
    const nextDate = new Date(s.next_billing_date)
    return nextDate >= now && nextDate <= sevenDaysLater
  })

  const upcomingRenewalsCost = upcomingRenewals.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0)

  // Most common payment method
  const paymentMethods = activeSubs.map(s => s.payment_method).filter(Boolean)
  const primaryMethod = paymentMethods.length > 0 ? paymentMethods[0] : "Belum diatur"

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Langganan & Lisensi</h1>
          <p className="text-xs text-muted-foreground">
            Kelola langganan SaaS rutin, biaya infrastruktur cloud, dan pengingat tanggal perpanjangan.
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
            size="sm" 
            onClick={handleOpenAdd}
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Langganan</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 border-border/80 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Total Pengeluaran Bulanan</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">
            ${totalMonthlySpend.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Dari {activeSubs.length} layanan aktif</p>
        </Card>
        <Card className="p-4 border-border/80 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Perpanjangan Mendatang (7 Hari)</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {upcomingRenewals.length} Layanan
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Estimasi biaya: ${upcomingRenewalsCost.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 border-border/80 shadow-xs sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Akun Pembayaran Terbanyak</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1 truncate">
            {primaryMethod}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Digunakan untuk langganan aktif</p>
        </Card>
      </div>

      {/* Search Bar Filter */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari layanan, penyedia, kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Layanan / Penyedia</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kategori</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Siklus Tagihan</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Biaya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tgl Tagihan Berikutnya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Metode Pembayaran</TableHead>
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
                      <p className="text-xs">Memuat data langganan...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <CreditCard className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada langganan ditemukan</p>
                      <p className="text-[11px]">Tambahkan akun SaaS, lisensi software, atau tagihan cloud baru.</p>
                      <Button size="sm" variant="outline" onClick={handleOpenAdd} className="h-7 text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> Tambah Langganan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="py-3">
                      <p className="font-semibold text-xs text-foreground">{sub.service_name}</p>
                      <p className="text-[10px] text-muted-foreground">{sub.provider || "Penyedia umum"}</p>
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-border/80">
                        {sub.category?.name || "Layanan"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                      {sub.billing_cycle === 'Monthly' ? 'Bulanan' :
                       sub.billing_cycle === 'Quarterly' ? 'Kuartal' :
                       sub.billing_cycle === 'Semi-Annually' ? 'Semesteran' :
                       sub.billing_cycle === 'Yearly' ? 'Tahunan' : sub.billing_cycle}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono font-bold text-foreground">
                      ${Number(sub.cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-primary font-medium">
                      {formatDate(sub.next_billing_date)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {sub.payment_method || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={sub.status === "Active" ? "default" : "secondary"} 
                        className={`text-[10px] font-mono px-2 py-0 h-5 ${
                          sub.status === "Active" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                        }`}
                      >
                        {sub.status === "Active" ? "Aktif" :
                         sub.status === "Cancelled" ? "Dibatalkan" :
                         sub.status === "Expired" ? "Kadaluarsa" : sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(sub)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit Langganan"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDelete(sub)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Hapus Langganan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Subscription Modal */}
      <SubscriptionModal
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
        title="Hapus Langganan"
        description={`Apakah Anda yakin ingin menghapus catatan langganan "${deletingItem?.service_name}"?`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
