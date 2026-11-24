import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatDateID } from "@/lib/formatters"
import { RotateCcw, Printer, Clock, MapPin } from "lucide-react"
import type { BorrowingItem } from "@/types/database"

interface BorrowingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: BorrowingItem | null
  onReturnClick?: (item: BorrowingItem) => void
  canReturn?: boolean
}

export function BorrowingDetailModal({
  isOpen,
  onClose,
  item,
  onReturnClick,
  canReturn = false,
}: BorrowingDetailModalProps) {
  const [activeTab, setActiveTab] = useState("lending")

  if (!item) return null

  const parseNotes = () => {
    let initialNotes: string | null = null
    let returnCondition = item.return_condition || null
    let returnNotes = item.return_notes || null

    if (item.notes) {
      const match = item.notes.match(/\[Pengembalian - Kondisi:\s*([^\]|]+)\](?:\s*Catatan:\s*([^\n]+))?/)
      if (match) {
        if (!returnCondition) returnCondition = match[1]?.trim() || null
        if (!returnNotes && match[2]) returnNotes = match[2]?.trim() || null
        initialNotes =
          item.notes.replace(/\[Pengembalian - Kondisi:[^\]]+\](?:\s*Catatan:[^\n]+)?/g, "").trim() || null
      } else {
        initialNotes = item.notes.trim()
      }
    }

    return {
      initialNotes,
      returnCondition: returnCondition || (item.status === "Returned" ? "Bagus" : null),
      returnNotes,
    }
  }

  const { initialNotes, returnCondition, returnNotes } = parseNotes()
  const isReturned = item.status === "Returned"
  const isPending = item.status === "Pending Approval"
  const isBorrowed = item.status === "Borrowed"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = isBorrowed && Boolean(item.due_date) && new Date(item.due_date) < today
  const transactionCode = `#BOR-${item.id.slice(0, 8).toUpperCase()}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-full">
        {/* Header */}
        <DialogHeader className="print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle>Formulir Peminjaman</DialogTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {transactionCode}
              </Badge>
            </div>
            <Badge
              variant={
                isReturned
                  ? "success"
                  : isOverdue
                  ? "destructive"
                  : isBorrowed
                  ? "info"
                  : isPending
                  ? "warning"
                  : "destructive"
              }
            >
              {isReturned
                ? "Dikembalikan"
                : isOverdue
                ? "Terlambat"
                : isBorrowed
                ? "Dipinjam"
                : isPending
                ? "Menunggu"
                : "Ditolak"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Timeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 print:hidden text-xs">
          <div className="p-2.5 rounded-lg border border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground block">Pengajuan</span>
            <span className="font-mono font-medium text-foreground">{formatDateID(item.request_date)}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground block">Mulai</span>
            <span className="font-mono font-medium text-foreground">
              {item.start_date ? formatDateID(item.start_date) : "-"}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground block">Jatuh Tempo</span>
            <span className={`font-mono font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`}>
              {formatDateID(item.due_date)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground block">Kembali</span>
            <span className={`font-mono font-medium ${isReturned ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {item.return_date ? formatDateID(item.return_date) : "-"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="print:hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || "lending")} className="space-y-3">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="lending">Peminjaman</TabsTrigger>
              <TabsTrigger value="return">Pengembalian</TabsTrigger>
            </TabsList>

            <TabsContent value="lending" className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-border space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Aset</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.inventory?.code || "-"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    {item.inventory?.name || "Aset"}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{item.inventory?.category?.name || "Umum"}</span>
                    {item.inventory?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.inventory.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Peminjam</span>
                    <Badge variant="secondary" className="capitalize">
                      {item.borrower?.role || "Staf"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    {item.borrower?.full_name || "Tanpa Nama"}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {item.borrower?.email || "-"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] text-muted-foreground block">Catatan</span>
                <p className="text-foreground">{initialNotes || "-"}</p>
              </div>
            </TabsContent>

            <TabsContent value="return" className="space-y-3 text-xs">
              {isReturned ? (
                <div className="p-3.5 rounded-lg border border-border space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">Kondisi Kembali</span>
                      <Badge
                        variant={
                          returnCondition === "Bagus"
                            ? "success"
                            : returnCondition === "Rusak Ringan"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {returnCondition}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">Status Pasca-Kembali</span>
                      <Badge variant={returnCondition === "Bagus" ? "success" : "warning"}>
                        {returnCondition === "Bagus" ? "Tersedia" : "Perawatan"}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border space-y-1">
                    <span className="text-[11px] text-muted-foreground block">Catatan Pemeriksaan</span>
                    <p className="text-foreground">{returnNotes || "-"}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 px-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-center gap-2.5">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">Belum dikembalikan</p>
                  {isBorrowed && canReturn && onReturnClick && (
                    <Button type="button" size="sm" onClick={() => onReturnClick(item)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Verifikasi Pengembalian</span>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Print View */}
        <div className="hidden print:block text-black space-y-5 p-4 font-sans">
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-lg font-bold uppercase">Berita Acara Peminjaman Aset</h2>
            <p className="text-xs font-mono">
              {transactionCode} · {formatDateID(new Date().toISOString())}
            </p>
          </div>
          <Table className="border border-border text-xs">
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Aset</TableCell>
                <TableCell>{item.inventory?.name || "-"}</TableCell>
                <TableCell className="font-semibold">Kode</TableCell>
                <TableCell className="font-mono">{item.inventory?.code || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Peminjam</TableCell>
                <TableCell>{item.borrower?.full_name || "-"}</TableCell>
                <TableCell className="font-semibold">Email</TableCell>
                <TableCell>{item.borrower?.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Tgl Pengajuan</TableCell>
                <TableCell className="font-mono">{formatDateID(item.request_date)}</TableCell>
                <TableCell className="font-semibold">Tenggat</TableCell>
                <TableCell className="font-mono">{formatDateID(item.due_date)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Tgl Kembali</TableCell>
                <TableCell className="font-mono">{item.return_date ? formatDateID(item.return_date) : "-"}</TableCell>
                <TableCell className="font-semibold">Kondisi Kembali</TableCell>
                <TableCell>{returnCondition || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Catatan</TableCell>
                <TableCell colSpan={3}>{returnNotes || initialNotes || "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <DialogFooter className="sm:justify-between print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cetak</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
            {isBorrowed && canReturn && onReturnClick && (
              <Button type="button" size="sm" onClick={() => onReturnClick(item)}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Kembalikan</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
