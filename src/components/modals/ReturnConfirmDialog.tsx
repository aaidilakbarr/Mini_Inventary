import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw, Loader2, PackageCheck, UserCheck, Calendar } from "lucide-react"
import { formatDateID } from "@/lib/formatters"
import type { BorrowingItem } from "@/types/database"

interface ReturnConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BorrowingItem | null
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
}

export function ReturnConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isLoading = false,
}: ReturnConfirmDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">Konfirmasi Pengembalian Aset</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Pastikan kondisi fisik barang sudah diperiksa sebelum mengonfirmasi pengembalian.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Item Details Box */}
        <div className="my-2 p-3.5 rounded-lg border border-border/80 bg-muted/30 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <PackageCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-xs">
                {item.inventory?.name || "Aset Inventaris"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Kode: {item.inventory?.code || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 border-t border-border/40">
            <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground text-[11px]">Peminjam: </span>
              <span className="font-medium text-foreground text-xs">
                {item.borrower?.full_name || "Tanpa Nama"}
              </span>
              <span className="text-muted-foreground text-[10px] ml-1">
                ({item.borrower?.email || "-"})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 border-t border-border/40">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-3 text-[11px]">
              <div>
                <span className="text-muted-foreground">Tenggat: </span>
                <span className="font-mono font-medium text-foreground">
                  {formatDateID(item.due_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Setelah dikembalikan, status peminjaman akan diperbarui menjadi <strong>Dikembalikan</strong> dan stok inventaris aset ini akan bertambah 1 unit.
        </p>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-primary text-primary-foreground gap-1.5"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            <span>Kembalikan Sekarang</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
