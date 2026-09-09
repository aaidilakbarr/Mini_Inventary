import { useState } from "react"
import { 
  Eye, 
  Edit2, 
  Trash2, 
  Laptop, 
  Armchair, 
  Truck,
  ArrowLeftRight
} from "lucide-react"
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

  // Status mapping matching Stockly reference badges
  const getStatusBadge = () => {
    if (item.status === "Borrowed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
          Dipinjam
        </span>
      )
    }
    if (item.status === "Maintenance") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-600 border border-slate-500/30">
          Perawatan
        </span>
      )
    }
    if (item.quantity === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-600/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
          Habis
        </span>
      )
    }
    if (item.quantity <= 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 border border-rose-500/30">
          Low Stock
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
        In Stock
      </span>
    )
  }

  // Visual Category Fallback Icon
  const getCategoryIllustration = () => {
    const catName = (item.category?.name || "").toLowerCase()
    if (catName.includes("elektronik") || catName.includes("komputer") || catName.includes("laptop")) {
      return (
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
          <Laptop className="h-10 w-10 stroke-[1.5]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
        </div>
      )
    }
    if (catName.includes("furniture") || catName.includes("mebel") || catName.includes("kursi") || catName.includes("meja")) {
      return (
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
          <Armchair className="h-10 w-10 stroke-[1.5]" />
        </div>
      )
    }
    if (catName.includes("kendaraan") || catName.includes("alat") || catName.includes("logistik")) {
      return (
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
          <Truck className="h-10 w-10 stroke-[1.5]" />
        </div>
      )
    }
    // Default Isometric 3D Asset Box Visual
    return (
      <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-primary border border-border shadow-xs group-hover:scale-105 transition-transform duration-200">
        <svg className="w-12 h-12 text-primary/80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 6L54 18V46L32 58L10 46V18L32 6Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M32 6V58" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
          <path d="M10 18L32 30L54 18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M32 30V58" stroke="currentColor" strokeWidth="2.5"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="group bg-card hover:bg-card/95 border border-border/80 hover:border-primary/40 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden">
      {/* Top Header: Status Badge & Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2 z-10">
        <div>{getStatusBadge()}</div>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit Aset"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item)
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Hapus Aset"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Asset Preview / Illustration Container */}
      <div 
        onClick={() => onViewDetail(item)}
        className="w-full h-36 flex items-center justify-center rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-800 mb-3.5 cursor-pointer overflow-hidden relative group-hover:bg-slate-100/60 dark:group-hover:bg-slate-900/60 transition-colors"
      >
        {item.photo_url && !imgError ? (
          <img
            src={item.photo_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="max-h-28 max-w-[85%] object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          getCategoryIllustration()
        )}
      </div>

      {/* Item Info: SKU & Title */}
      <div className="space-y-1 mb-3.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span className="font-semibold tracking-wide text-primary/90">{item.code}</span>
          {item.category && (
            <span className="truncate max-w-[110px] px-2 py-0.5 rounded-full bg-muted/80 text-[10px] font-medium border border-border/60">
              {item.category.name}
            </span>
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

      {/* Key Metrics: Kuantitas & Lokasi/Kondisi (Opsi B) */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 text-xs mb-3.5">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">
            Kuantitas
          </span>
          <span className="font-bold text-foreground font-mono">
            {item.quantity} Unit
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold truncate">
            Lokasi & Kondisi
          </span>
          <span className="text-xs font-medium text-foreground truncate block" title={`${item.location || 'Gudang'} • ${item.condition || 'Bagus'}`}>
            {item.location || 'Gudang'} • {item.condition || 'Bagus'}
          </span>
        </div>
      </div>

      {/* Action CTAs: Lihat Detail & Pinjam Barang */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetail(item)}
          className="h-9 text-[11px] sm:text-xs font-semibold text-foreground hover:text-primary hover:bg-primary/10 border-border/80 hover:border-primary/40 transition-all duration-150 rounded-xl px-1.5 sm:px-2 flex items-center justify-center min-w-0"
          title="Lihat Detail Aset"
        >
          <Eye className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span className="truncate">Lihat Detail</span>
        </Button>
        <Button
          size="sm"
          disabled={item.status !== "Available" || (item.quantity ?? 0) <= 0}
          onClick={(e) => {
            e.stopPropagation()
            onBorrow?.(item)
          }}
          className={`h-9 text-[11px] sm:text-xs font-semibold rounded-xl transition-all duration-150 px-1.5 sm:px-2 flex items-center justify-center min-w-0 ${
            item.status === "Available" && (item.quantity ?? 0) > 0
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-60 hover:bg-muted"
          }`}
          title={
            item.status !== "Available"
              ? `Status: ${item.status}`
              : (item.quantity ?? 0) <= 0
              ? "Stok Habis"
              : "Pinjam Barang"
          }
        >
          <ArrowLeftRight className="h-3.5 w-3.5 mr-1 shrink-0" />
          <span className="truncate">Pinjam Barang</span>
        </Button>
      </div>
    </div>
  )
}
