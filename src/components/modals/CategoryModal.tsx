import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag, Loader2 } from "lucide-react"
import type { Category } from "@/types/database"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, type: 'inventory' | 'subscription' | 'general', description?: string) => Promise<void>
  initialData?: Category | null
}

export function CategoryModal({ isOpen, onClose, onSubmit, initialData }: CategoryModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<'inventory' | 'subscription' | 'general'>('inventory')
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "")
      setType(initialData.type || "inventory")
      setDescription(initialData.description || "")
    } else {
      setName("")
      setType("inventory")
      setDescription("")
    }
    setError(null)
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit(name.trim(), type, description.trim() || undefined)
      onClose()
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan kategori.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>{initialData ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                <DialogDescription>
                  Atur kategori untuk pengelompokan aset inventaris dan langganan layanan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs font-semibold">
                Nama Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Laptop, Server Cloud, Lisensi Desain"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-type" className="text-xs font-semibold">
                Tipe Penggunaan <span className="text-destructive">*</span>
              </Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger id="cat-type" className="h-8 text-xs">
                  <SelectValue placeholder="Pilih tipe kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventaris (Aset Fisik)</SelectItem>
                  <SelectItem value="subscription">Langganan (SaaS / Cloud / Domain)</SelectItem>
                  <SelectItem value="general">Umum / Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs font-semibold">
                Deskripsi / Keterangan (Opsional)
              </Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat kategori ini"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="h-8 text-xs">
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs font-medium gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kategori</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
