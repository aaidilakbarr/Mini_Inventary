import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  RefreshCw,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  Loader2,
  Calendar,
  Layers,
  AlertCircle
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
import { useAuth } from "@/hooks/useAuth"
import { formatDateID, formatCurrencyID } from "@/lib/formatters"
import type { SubscriptionItem, Category, CreateSubscriptionPayload } from "@/types/database"

export function SubscriptionsPage() {
  const { isAdmin } = useAuth()
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Semua")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null)

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<SubscriptionItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subsData, catsData] = await Promise.all([
        fetchSubscriptions(),
        fetchCategories('subscription'),
      ])
      setSubscriptions(subsData)
      setCategories(catsData)
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

  const handleSave = async (payload: CreateSubscriptionPayload) => {
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

  const exportCSV = () => {
    if (subscriptions.length === 0) return
    const headers = ["Nama Layanan", "Penyedia", "Kategori", "Biaya (IDR)", "Siklus", "Tagihan Berikutnya", "Metode Pembayaran", "Status"]
    const rows = subscriptions.map(s => [
      `"${s.service_name}"`,
      `"${s.provider || '-'}"`,
      `"${s.category?.name || '-'}"`,
      s.cost,
      `"${s.billing_cycle}"`,
      `"${s.next_billing_date}"`,
      `"${s.payment_method || '-'}"`,
      `"${s.status}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `langganan_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate stats
  const activeSubs = subscriptions.filter(s => s.status === 'Active')
  const totalMonthlyCost = activeSubs.reduce((acc, curr) => {
    const cost = Number(curr.cost) || 0
    if (curr.billing_cycle === 'Monthly') return acc + cost
    if (curr.billing_cycle === 'Quarterly') return acc + (cost / 3)
    if (curr.billing_cycle === 'Semi-Annually') return acc + (cost / 6)
    if (curr.billing_cycle === 'Yearly') return acc + (cost / 12)
    return acc + cost
  }, 0)

  const filteredItems = subscriptions.filter((item) => {
    const matchesSearch =
      item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.provider || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === "Aktif") matchesStatus = item.status === "Active"
    else if (statusFilter === "Jatuh Tempo") matchesStatus = item.status === "Past Due"
    else if (statusFilter === "Dibatalkan") matchesStatus = item.status === "Cancelled"
    else if (statusFilter === "Kedaluwarsa") matchesStatus = item.status === "Expired"

    return matchesSearch && matchesStatus
  })

  const statusOptions = ["Semua", "Aktif", "Jatuh Tempo", "Dibatalkan", "Kedaluwarsa"]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Langganan & Lisensi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Lacak pengeluaran biaya berkala, lisensi software, dan siklus tagihan aktif.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={subscriptions.length === 0}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200/90 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/60 gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ekspor CSV</span>
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Tambah Langganan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Estimasi Beban Bulanan</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatCurrencyID(totalMonthlyCost)}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Langganan Aktif</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {activeSubs.length} <span className="text-xs font-normal text-muted-foreground">Layanan</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Keseluruhan</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {subscriptions.length} <span className="text-xs font-normal text-muted-foreground">Akun Terdata</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari langganan atau provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/80 w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {statusOptions.map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="h-7 text-xs px-3 rounded-full shrink-0 whitespace-nowrap"
              >
                {st}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Subscriptions Table */}
      <Card className="border-border/80 shadow-xs">
        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Layanan / Provider</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Kategori</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Biaya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Siklus</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Tagihan Berikutnya</TableHead>
                <TableHead className="text-[11px] font-mono uppercase font-semibold h-9">Status</TableHead>
                {isAdmin && <TableHead className="text-[11px] font-mono uppercase font-semibold h-9 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">Memuat data langganan...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <CreditCard className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-medium text-foreground">Tidak ada data langganan</p>
                      <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={handleOpenAdd} className="h-7 text-xs mt-1">
                          <Plus className="h-3 w-3 mr-1" /> Tambah Langganan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isPastDue = item.status === "Past Due"
                  return (
                    <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="py-3">
                        <p className="font-semibold text-xs text-foreground">{item.service_name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.provider || "Penyedia Eksternal"}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px] font-normal px-2.5 py-0.5 rounded-full border-border">
                          {item.category?.name || "Umum"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs font-bold text-foreground">
                        {formatCurrencyID(item.cost)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {item.billing_cycle}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-mono">
                        <span className={isPastDue ? "text-destructive font-bold flex items-center gap-1" : "text-foreground"}>
                          {isPastDue && <AlertCircle className="h-3 w-3 inline" />}
                          {formatDateID(item.next_billing_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            item.status === "Active" ? "default" :
                            item.status === "Past Due" ? "destructive" :
                            item.status === "Cancelled" ? "secondary" : "outline"
                          }
                          className="text-[10px] font-mono px-2.5 py-0.5 rounded-full"
                        >
                          {item.status === "Active" ? "Aktif" :
                           item.status === "Past Due" ? "Jatuh Tempo" :
                           item.status === "Cancelled" ? "Dibatalkan" : "Kedaluwarsa"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit Langganan"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(item)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Hapus Langganan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        categories={categories}
        onSubmit={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Catatan Langganan"
        description={`Apakah Anda yakin ingin menghapus langganan "${deletingItem?.service_name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
