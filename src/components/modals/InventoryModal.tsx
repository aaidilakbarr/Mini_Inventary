import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RefreshCw,
  Barcode,
  UploadCloud,
  Minus,
  Plus,
  Loader2,
  Trash2,
  Link2,
  Image as ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InventoryItem, CreateInventoryPayload, Category, InventoryStatus } from "@/types/database"
import { uploadInventoryPhoto, MAX_PHOTO_SIZE_BYTES } from "@/lib/api/storage"

interface InventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: InventoryItem | null
  categories: Category[]
  onSubmit: (payload: CreateInventoryPayload) => Promise<void>
}

const STATUS_OPTIONS: Array<{ value: InventoryStatus; label: string; dot: string }> = [
  { value: "Available", label: "Tersedia", dot: "bg-emerald-500" },
  { value: "Maintenance", label: "Perawatan", dot: "bg-amber-500" },
  { value: "Borrowed", label: "Dipinjam", dot: "bg-primary" },
  { value: "Lost", label: "Hilang", dot: "bg-destructive" },
]

export function InventoryModal({
  open,
  onOpenChange,
  initialData,
  categories,
  onSubmit,
}: InventoryModalProps) {
  const [formData, setFormData] = useState<CreateInventoryPayload>({
    code: "",
    name: "",
    category_id: "",
    quantity: 1,
    condition: "Bagus",
    location: "",
    supplier: "",
    warranty_info: "",
    status: "Available",
    notes: "",
    photo_url: null,
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageSourceMode, setImageSourceMode] = useState<"file" | "url">("file")
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateAssetCode = () => `INV-${Math.floor(100 + Math.random() * 900)}`

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        category_id: initialData.category_id || "",
        quantity: initialData.quantity ?? 1,
        condition: initialData.condition || "Bagus",
        location: initialData.location || "",
        supplier: initialData.supplier || "",
        warranty_info: initialData.warranty_info || "",
        status: initialData.status || "Available",
        notes: initialData.notes || "",
        photo_url: initialData.photo_url || null,
      })
      setPreviewImage(initialData.photo_url || null)
      if (initialData.photo_url && !initialData.photo_url.includes("inventory-images")) {
        setImageUrlInput(initialData.photo_url)
        setImageSourceMode("url")
      } else {
        setImageUrlInput("")
        setImageSourceMode("file")
      }
    } else {
      setFormData({
        code: generateAssetCode(),
        name: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        quantity: 1,
        condition: "Bagus",
        location: "",
        supplier: "",
        warranty_info: "",
        status: "Available",
        notes: "",
        photo_url: null,
      })
      setPreviewImage(null)
      setImageUrlInput("")
      setImageSourceMode("file")
    }
    setSelectedFile(null)
    setIsUploadingPhoto(false)
    setErrorMsg("")
  }, [initialData, open, categories])

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMsg("Ukuran gambar maksimal 5MB.")
      return
    }

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedMime.includes(file.type)) {
      setErrorMsg("Gunakan format JPG, PNG, atau WEBP.")
      return
    }

    setErrorMsg("")
    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewImage(localUrl)
    setFormData((prev) => ({ ...prev, photo_url: localUrl }))
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreviewImage(null)
    setImageUrlInput("")
    setFormData((prev) => ({ ...prev, photo_url: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUrlInputChange = (url: string) => {
    setImageUrlInput(url)
    setSelectedFile(null)
    const trimmed = url.trim()
    setPreviewImage(trimmed || null)
    setFormData((prev) => ({ ...prev, photo_url: trimmed || null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg("Nama barang wajib diisi.")
      return
    }
    if (!formData.code.trim()) {
      setErrorMsg("Kode aset wajib diisi.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")

      let finalPhotoUrl = formData.photo_url
      if (selectedFile) {
        setIsUploadingPhoto(true)
        finalPhotoUrl = await uploadInventoryPhoto(selectedFile, formData.code)
      } else if (imageSourceMode === "url") {
        finalPhotoUrl = imageUrlInput.trim() || null
      }

      await onSubmit({
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        quantity: Math.max(1, Number(formData.quantity) || 1),
        photo_url: finalPhotoUrl,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan aset.")
    } finally {
      setIsSubmitting(false)
      setIsUploadingPhoto(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.name.trim() && !formData.code.trim()) {
      setErrorMsg("Isi minimal nama barang atau kode aset.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")

      let finalPhotoUrl = formData.photo_url
      if (selectedFile) {
        setIsUploadingPhoto(true)
        try {
          finalPhotoUrl = await uploadInventoryPhoto(selectedFile, formData.code)
        } catch (uploadErr) {
          console.error("Gagal mengunggah foto draf:", uploadErr)
        }
      } else if (imageSourceMode === "url") {
        finalPhotoUrl = imageUrlInput.trim() || null
      }

      await onSubmit({
        ...formData,
        code: formData.code.trim() || generateAssetCode(),
        name: formData.name.trim() || "Draf Aset",
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        quantity: Math.max(1, Number(formData.quantity) || 1),
        status: "Available",
        photo_url: finalPhotoUrl,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan draf.")
    } finally {
      setIsSubmitting(false)
      setIsUploadingPhoto(false)
    }
  }

  const selectedCatLabel =
    formData.category_id && formData.category_id !== "none"
      ? categories.find((c) => c.id === formData.category_id)?.name || "Pilih Kategori"
      : "Tanpa Kategori"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Aset" : "Tambah Aset"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
          {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

          {/* Row 1: Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Nama Barang <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nama barang atau model"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="code" className="text-xs">
                  Kode Aset <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => setFormData((prev) => ({ ...prev, code: generateAssetCode() }))}
                  className="h-auto p-0 text-[11px]"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Generate</span>
                </Button>
              </div>
              <div className="relative">
                <Barcode className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="code"
                  placeholder="INV-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="pl-8 font-mono font-semibold uppercase"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : val })
                }
              >
                <SelectTrigger>
                  <SelectValue>{selectedCatLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs">Lokasi</Label>
              <Input
                id="location"
                placeholder="Lokasi penyimpanan"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: Quantity, Condition, Warranty */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Jumlah</Label>
              <div className="flex items-center h-9 rounded-lg border border-input bg-card px-1 justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, (Number(prev.quantity) || 1) - 1),
                    }))
                  }
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="font-mono font-semibold text-xs tabular-nums">
                  {formData.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: (Number(prev.quantity) || 0) + 1,
                    }))
                  }
                  aria-label="Tambah jumlah"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Kondisi</Label>
              <Select
                value={formData.condition || "Bagus"}
                onValueChange={(val) => setFormData({ ...formData, condition: val || "Bagus" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bagus">Bagus</SelectItem>
                  <SelectItem value="Baru">Baru</SelectItem>
                  <SelectItem value="Cukup">Cukup</SelectItem>
                  <SelectItem value="Perlu Perbaikan">Perlu Perbaikan</SelectItem>
                  <SelectItem value="Rusak">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warranty" className="text-xs">Garansi</Label>
              <Input
                id="warranty"
                placeholder="Masa garansi"
                value={formData.warranty_info || ""}
                onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4: Supplier & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="text-xs">Vendor</Label>
              <Input
                id="supplier"
                placeholder="Nama vendor (opsional)"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Catatan</Label>
              <Input
                id="notes"
                placeholder="Catatan singkat"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Row 5: Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = formData.status === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setFormData({ ...formData, status: opt.value })}
                    className={cn(
                      "rounded-full h-7 px-3 gap-1.5",
                      isSelected && "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    )}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Row 6: Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Foto Aset</Label>
              <Tabs
                value={imageSourceMode}
                onValueChange={(val) => setImageSourceMode((val as "file" | "url") || "file")}
              >
                <TabsList className="h-7">
                  <TabsTrigger value="file" className="px-2 text-[11px]">
                    <ImageIcon className="h-3 w-3" />
                    <span>Unggah</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="px-2 text-[11px]">
                    <Link2 className="h-3 w-3" />
                    <span>URL</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {imageSourceMode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center transition-colors cursor-pointer bg-muted/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                {previewImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Pratinjau Aset"
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 rounded-full"
                        aria-label="Hapus gambar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedFile ? selectedFile.name : "Klik untuk ganti gambar"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">Pilih gambar</p>
                    <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP maks. 5MB</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://..."
                    value={imageUrlInput}
                    onChange={(e) => handleUrlInputChange(e.target.value)}
                  />
                  {imageUrlInput && (
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                      Hapus
                    </Button>
                  )}
                </div>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Pratinjau URL"
                    onError={() => setErrorMsg("Gagal memuat pratinjau dari URL tersebut.")}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploadingPhoto}
            >
              Batal
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isUploadingPhoto}
              >
                Simpan Draf
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || isUploadingPhoto}>
                {isSubmitting || isUploadingPhoto ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{isUploadingPhoto ? "Mengunggah..." : "Menyimpan..."}</span>
                  </>
                ) : (
                  <span>{initialData ? "Simpan" : "Tambah Aset"}</span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
