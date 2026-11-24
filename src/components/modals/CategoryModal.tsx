import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Category } from "@/types/database"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, type: "inventory" | "subscription" | "general", description?: string) => Promise<void>
  initialData?: Category | null
}

const TYPE_LABELS: Record<string, string> = {
  inventory: "Inventaris",
  subscription: "Langganan",
  general: "Umum",
}

export function CategoryModal({ isOpen, onClose, onSubmit, initialData }: CategoryModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"inventory" | "subscription" | "general">("inventory")
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
            <DialogTitle>{initialData ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs">
                Nama Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Laptop, Lisensi Desain"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-type" className="text-xs">
                Modul <span className="text-destructive">*</span>
              </Label>
              <Select value={type} onValueChange={(val) => setType((val as typeof type) || "inventory")}>
                <SelectTrigger id="cat-type">
                  <SelectValue>{TYPE_LABELS[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventaris</SelectItem>
                  <SelectItem value="subscription">Langganan</SelectItem>
                  <SelectItem value="general">Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs">Keterangan (Opsional)</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
