import { useState } from "react"
import {
  Eye,
  Edit2,
  Trash2,
  Laptop,
  Armchair,
  Truck,
  Package,
  ArrowLeftRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { InventoryItem } from "@/types/database"

interface InventoryCardProps {
  item: InventoryItem
  isAdmin: boolean
  onViewDetail: (item: InventoryItem) => void
  onBorrow?: (item: InventoryItem) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export function InventoryCard({
  item,
  isAdmin,
  onViewDetail,
  onBorrow,
  onEdit,
  onDelete,
}: InventoryCardProps) {
  const [imgError, setImgError] = useState(false)

  const canBorrow = item.status === "Available" && (item.quantity ?? 0) > 0

  const renderStatusBadge = () => {
    if (item.status === "Borrowed") return <Badge variant="info">Dipinjam</Badge>
    if (item.status === "Maintenance") return <Badge variant="warning">Perawatan</Badge>
    if (item.status === "Lost") return <Badge variant="destructive">Hilang</Badge>
    if (item.quantity === 0) return <Badge variant="secondary">Habis</Badge>
    if (item.quantity <= 2) return <Badge variant="warning">Stok Menipis</Badge>
    return <Badge variant="success">Tersedia</Badge>
  }

  const renderCategoryIcon = () => {
    const catName = (item.category?.name || "").toLowerCase()
    if (catName.includes("elektronik") || catName.includes("komputer") || catName.includes("laptop")) {
      return <Laptop className="h-9 w-9 text-primary/80 stroke-[1.6]" />
    }
    if (catName.includes("furniture") || catName.includes("mebel") || catName.includes("kursi") || catName.includes("meja")) {
      return <Armchair className="h-9 w-9 text-muted-foreground stroke-[1.6]" />
    }
    if (catName.includes("kendaraan") || catName.includes("alat") || catName.includes("logistik")) {
      return <Truck className="h-9 w-9 text-muted-foreground stroke-[1.6]" />
    }
    return <Package className="h-9 w-9 text-muted-foreground stroke-[1.6]" />
  }

  return (
    <Card className="group p-4 flex flex-col justify-between card-interactive hover:border-primary/40">
      {/* Top Row: Solid Status & Touch-Accessible Admin Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {renderStatusBadge()}
        {isAdmin && (
          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${item.name}`}
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item)
              }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={`Hapus ${item.name}`}
              title="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Preview Thumbnail */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewDetail(item)}
        className="w-full h-36 p-2 rounded-lg bg-muted/50 border border-border/60 mb-3 overflow-hidden hover:bg-muted/80"
        aria-label={`Lihat detail ${item.name}`}
      >
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          renderCategoryIcon()
        )}
      </Button>

      {/* Code, Category & Name */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-primary">
            {item.code}
          </span>
          {item.category && (
            <Badge variant="outline" className="max-w-[110px] truncate text-[10px]">
              {item.category.name}
            </Badge>
          )}
        </div>
        <h3
          onClick={() => onViewDetail(item)}
          className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
          title={item.name}
        >
          {item.name}
        </h3>
      </div>

      {/* Compact Metrics */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border text-xs mb-3">
        <span className="font-mono font-bold text-foreground tabular-nums">
          {item.quantity} unit
        </span>
        <span className="text-muted-foreground truncate max-w-[140px]">
          {item.location || "Gudang"} · {item.condition || "Bagus"}
        </span>
      </div>

      {/* Touch-Friendly Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onViewDetail(item)}
          className="px-2"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate">Detail</span>
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canBorrow}
          onClick={(e) => {
            e.stopPropagation()
            onBorrow?.(item)
          }}
          className="px-2"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span className="truncate">Pinjam</span>
        </Button>
      </div>
    </Card>
  )
}
