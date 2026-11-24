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
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SubscriptionModal } from "@/components/modals/SubscriptionModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import {
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<SubscriptionItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [subsData, catsData] = await Promise.all([
        fetchSubscriptions(),
        fetchCategories("subscription"),
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
    const rows = subscriptions.map((s) => [
      `"${s.service_name}"`,
      `"${s.provider || "-"}"`,
      `"${s.category?.name || "-"}"`,
      s.cost,
      `"${s.billing_cycle}"`,
      `"${s.next_billing_date}"`,
      `"${s.payment_method || "-"}"`,
      `"${s.status}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `langganan_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeSubs = subscriptions.filter((s) => s.status === "Active")
  const totalMonthlyCost = activeSubs.reduce((acc, curr) => {
    const cost = Number(curr.cost) || 0
    if (curr.billing_cycle === "Monthly") return acc + cost
    if (curr.billing_cycle === "Quarterly") return acc + cost / 3
    if (curr.billing_cycle === "Semi-Annually") return acc + cost / 6
    if (curr.billing_cycle === "Yearly") return acc + cost / 12
    return acc + cost
  }, 0)

  const filteredItems = subscriptions.filter((item) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      item.service_name.toLowerCase().includes(q) ||
      (item.provider || "").toLowerCase().includes(q) ||
      (item.category?.name || "").toLowerCase().includes(q)

    let matchesStatus = true
    if (statusFilter === "Aktif") matchesStatus = item.status === "Active"
    else if (statusFilter === "Jatuh Tempo") matchesStatus = item.status === "Past Due"
    else if (statusFilter === "Dibatalkan") matchesStatus = item.status === "Cancelled"
    else if (statusFilter === "Kedaluwarsa") matchesStatus = item.status === "Expired"

    return matchesSearch && matchesStatus
  })

  const statusOptions = ["Semua", "Aktif", "Jatuh Tempo", "Dibatalkan", "Kedaluwarsa"]

  const renderStatusBadge = (status: string) => {
    if (status === "Active") return <Badge variant="success">Aktif</Badge>
    if (status === "Past Due") return <Badge variant="destructive">Jatuh Tempo</Badge>
    if (status === "Cancelled") return <Badge variant="secondary">Dibatalkan</Badge>
    return <Badge variant="outline">Kedaluwarsa</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
          Langganan
        </h1>

        <div className={`${isAdmin ? "grid grid-cols-2 sm:flex" : "flex"} items-center gap-2 w-full md:w-auto`}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className={!isAdmin ? "w-full sm:w-auto" : ""}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={subscriptions.length === 0}>
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ekspor</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null)
                  setIsModalOpen(true)
                }}
                className="col-span-2 sm:col-span-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Langganan</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Responsive KPI Strip: 1 full-width + 2 half-width on mobile, 3-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="col-span-2 sm:col-span-1 border-t-2 border-t-primary">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Beban Bulanan</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5 truncate" title={formatCurrencyID(totalMonthlyCost)}>
                {formatCurrencyID(totalMonthlyCost)}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
                {activeSubs.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
                {subscriptions.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari layanan atau penyedia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 sm:h-9"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val || "Semua")}>
            <TabsList className="w-full lg:w-fit overflow-x-auto justify-start">
              {statusOptions.map((st) => (
                <TabsTrigger key={st} value={st} className="flex-none">
                  {st}
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
            <p className="text-xs">Memuat langganan...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-6 text-center">
            <CreditCard className="h-7 w-7 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">Belum ada data langganan</p>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingItem(null)
                  setIsModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Langganan</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table className="min-w-[780px]">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4 text-xs font-semibold text-muted-foreground">Layanan</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Kategori</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Biaya</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Siklus</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Tagihan Berikutnya</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    {isAdmin && (
                      <TableHead className="px-4 text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isPastDue = item.status === "Past Due"
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">
                          <p className="font-semibold text-xs text-foreground">{item.service_name}</p>
                          {item.provider && (
                            <p className="text-[11px] text-muted-foreground">{item.provider}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline">{item.category?.name || "Umum"}</Badge>
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs font-bold text-foreground tabular-nums">
                          {formatCurrencyID(item.cost)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {item.billing_cycle}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono">
                          <span className={isPastDue ? "text-destructive font-bold inline-flex items-center gap-1" : "text-foreground"}>
                            {isPastDue && <AlertCircle className="h-3 w-3" />}
                            {formatDateID(item.next_billing_date)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">{renderStatusBadge(item.status)}</TableCell>
                        {isAdmin && (
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setEditingItem(item)
                                  setIsModalOpen(true)
                                }}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${item.service_name}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setDeletingItem(item)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                aria-label={`Hapus ${item.service_name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredItems.map((item) => {
                const isPastDue = item.status === "Past Due"
                return (
                  <div key={item.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{item.service_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.provider || "Umum"} · {item.category?.name || "Umum"}
                        </p>
                      </div>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Biaya ({item.billing_cycle})</span>
                        <span className="font-mono font-bold text-foreground tabular-nums">
                          {formatCurrencyID(item.cost)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Tagihan Berikutnya</span>
                        <span className={`font-mono font-semibold ${isPastDue ? "text-destructive" : "text-foreground"}`}>
                          {formatDateID(item.next_billing_date)}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item)
                            setIsModalOpen(true)
                          }}
                          className="flex-1"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setDeletingItem(item)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          aria-label={`Hapus ${item.service_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <SubscriptionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingItem}
        categories={categories}
        onSubmit={handleSave}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Langganan"
        description={`Hapus langganan "${deletingItem?.service_name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
