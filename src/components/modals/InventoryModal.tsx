import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Boxes,
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
import type { InventoryItem, CreateInventoryPayload, Category } from "@/types/database"
import { uploadInventoryPhoto, MAX_PHOTO_SIZE_BYTES } from "@/lib/api/storage"

interface InventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: InventoryItem | null
  categories: Category[]
  onSubmit: (payload: CreateInventoryPayload) => Promise<void>
}

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

  // Generate suggested asset code (e.g. INV-384 or SKU019840)
  const generateAssetCode = () => {
    const rand = Math.floor(100 + Math.random() * 900)
    return `INV-${rand}`
  }

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

  const handleAutoGenerateCode = () => {
    setFormData((prev) => ({ ...prev, code: generateAssetCode() }))
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMsg("Ukuran file gambar maksimal 5MB")
      return
    }

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedMime.includes(file.type)) {
      setErrorMsg("Format berkas tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.")
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlInputChange = (url: string) => {
    setImageUrlInput(url)
    setSelectedFile(null)
    if (url.trim()) {
      setPreviewImage(url.trim())
      setFormData((prev) => ({ ...prev, photo_url: url.trim() }))
    } else {
      setPreviewImage(null)
      setFormData((prev) => ({ ...prev, photo_url: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg("Nama Barang / Model wajib diisi")
      return
    }
    if (!formData.code.trim()) {
      setErrorMsg("Kode Aset wajib diisi")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg("")

      let finalPhotoUrl = formData.photo_url

      // If a local file was selected, upload it directly to Supabase Storage
      if (selectedFile) {
        setIsUploadingPhoto(true)
        try {
          finalPhotoUrl = await uploadInventoryPhoto(selectedFile, formData.code)
        } catch (uploadErr: any) {
          console.error("Gagal mengunggah foto ke storage:", uploadErr)
          setErrorMsg(uploadErr.message || "Gagal mengunggah foto ke penyimpanan.")
          setIsSubmitting(false)
          setIsUploadingPhoto(false)
          return
        }
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
      console.error("Gagal menyimpan inventaris:", err)
      setErrorMsg(err.message || "Gagal menyimpan data aset")
    } finally {
      setIsSubmitting(false)
      setIsUploadingPhoto(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.name.trim() && !formData.code.trim()) {
      setErrorMsg("Harap isi setidaknya Nama Barang atau Kode Aset untuk menyimpan draf")
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
        } catch (uploadErr: any) {
          console.error("Gagal mengunggah foto draf:", uploadErr)
        }
      } else if (imageSourceMode === "url") {
        finalPhotoUrl = imageUrlInput.trim() || null
      }

      await onSubmit({
        ...formData,
        code: formData.code.trim() || generateAssetCode(),
        name: formData.name.trim() || "Draf Aset Baru",
        category_id: formData.category_id && formData.category_id !== "none" ? formData.category_id : null,
        quantity: Math.max(1, Number(formData.quantity) || 1),
        status: "Available",
        photo_url: finalPhotoUrl,
      })
      onOpenChange(false)
    } catch (err: any) {
      console.error("Gagal menyimpan draf:", err)
      setErrorMsg(err.message || "Gagal menyimpan draf aset")
    } finally {
      setIsSubmitting(false)
      setIsUploadingPhoto(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 rounded-2xl">
        {/* Header - Layout persis gambar referensi */}
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {initialData ? "Edit Data Aset" : "Tambah Aset Baru"}
                  </DialogTitle>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                    {initialData ? "Edit Aset" : "Aset Baru"}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Daftarkan aset baru, kelola penempatan lokasi/gudang, dan tentukan kuantitas awal.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Baris 1: Nama Barang / Model & Kode Aset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Nama Barang / Model <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Masukkan Nama Barang"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="code" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Kode Aset <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleAutoGenerateCode}
                  className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline focus:outline-none transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
                  <Barcode className="h-4 w-4 text-muted-foreground/80" />
                </div>
                <Input
                  id="code"
                  placeholder="misal: INV-MAC-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="h-10 pl-9 text-xs font-mono font-bold uppercase rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Baris 2: Kategori & Lokasi Penyimpanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Kategori <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val === "none" ? null : val })
                }
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus:ring-blue-500/30">
                  <SelectValue placeholder="Pilih Kategori">
                    {formData.category_id && formData.category_id !== "none"
                      ? categories.find((c) => c.id === formData.category_id)?.name || "Pilih Kategori"
                      : "Pilih Kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Pilih Kategori --</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-foreground">
                Lokasi Penyimpanan
              </Label>
              <Input
                id="location"
                placeholder="Masukkan Lokasi Penyimpanan"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Baris 3: Container Metrik Stok (Card Rounded Abu-Abu persis gambar referensi) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/25 dark:bg-muted/10 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            {/* Jumlah dengan Stepper [ - ] [ 1 ] [ + ] */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Jumlah (Unit)</Label>
              <div className="flex items-center h-10 rounded-xl border border-border/80 bg-background px-1 justify-between shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, (Number(prev.quantity) || 1) - 1),
                    }))
                  }
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="font-mono font-bold text-xs text-foreground px-2">
                  {formData.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: (Number(prev.quantity) || 0) + 1,
                    }))
                  }
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Kondisi Fisik */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kondisi Fisik</Label>
              <Select
                value={formData.condition || "Bagus"}
                onValueChange={(val) => setFormData({ ...formData, condition: val })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/80 shadow-xs">
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

            {/* Masa Garansi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Masa Garansi</Label>
              <Input
                id="warranty"
                placeholder="Masukkan Garansi"
                value={formData.warranty_info || ""}
                onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                className="h-10 text-xs rounded-xl bg-background border-border/80 shadow-xs"
              />
            </div>
          </div>

          {/* Baris 4: Pemasok / Vendor & Catatan Tambahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="text-xs font-semibold text-foreground">
                Pemasok / Vendor
              </Label>
              <Input
                id="supplier"
                placeholder="Masukkan Vendor (Opsional)"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
                Catatan Tambahan
              </Label>
              <Input
                id="notes"
                placeholder="Masukkan Catatan"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Baris 5: Status Aset - Radio Pills persis gambar referensi */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Status Aset</Label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Tersedia (Available) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Available" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Available"
                  ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Available"
                    ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                    : "bg-emerald-500/40"
                    }`}
                />
                <span>Tersedia</span>
              </button>

              {/* Perawatan (Maintenance) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Maintenance" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Maintenance"
                  ? "bg-amber-500/10 border-amber-500/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Maintenance"
                    ? "bg-amber-500 ring-2 ring-amber-500/30"
                    : "bg-amber-500/40"
                    }`}
                />
                <span>Perawatan</span>
              </button>

              {/* Dipinjam (Borrowed) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Borrowed" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Borrowed"
                  ? "bg-blue-500/10 border-blue-500/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Borrowed"
                    ? "bg-blue-500 ring-2 ring-blue-500/30"
                    : "bg-blue-500/40"
                    }`}
                />
                <span>Dipinjam</span>
              </button>

              {/* Hilang (Lost) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "Lost" })}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${formData.status === "Lost"
                  ? "bg-rose-500/10 border-rose-500/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 font-semibold"
                  : "bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${formData.status === "Lost"
                    ? "bg-rose-500 ring-2 ring-rose-500/30"
                    : "bg-rose-500/40"
                    }`}
                />
                <span>Hilang</span>
              </button>
            </div>
          </div>

          {/* Baris 6: Visual / Foto Aset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">Visual / Foto Aset</Label>
              
              {/* Mode Switch: Upload File vs Tautan URL */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/70 text-[10px]">
                <button
                  type="button"
                  onClick={() => setImageSourceMode("file")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                    imageSourceMode === "file"
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Unggah Berkas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode("url")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                    imageSourceMode === "url"
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 className="h-3 w-3" />
                  <span>Tautan URL</span>
                </button>
              </div>
            </div>

            {imageSourceMode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-blue-500/50 dark:hover:border-blue-400/50 rounded-2xl p-5 text-center transition-all cursor-pointer bg-muted/10 hover:bg-muted/20 group relative overflow-hidden"
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
                    <div className="relative group/preview">
                      <img
                        src={previewImage}
                        alt="Preview Aset"
                        className="h-24 w-24 object-cover rounded-xl border border-border/60 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
                        title="Hapus gambar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedFile ? `Berkas terpilih: ${selectedFile.name}` : "Klik untuk memilih gambar lain"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground group-hover:text-blue-600 transition-colors shadow-2xs">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Klik atau seret file gambar ke sini</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Mendukung format PNG, JPG, atau WEBP hingga 5MB (disimpan ke Supabase Storage)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl border border-border/80 bg-muted/10">
                <div className="space-y-1.5">
                  <Label htmlFor="image-url" className="text-[11px] text-muted-foreground">
                    URL Gambar Eksternal / CDN Produk
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="image-url"
                        placeholder="https://images.unsplash.com/... atau URL produk vendor"
                        value={imageUrlInput}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                        className="h-9 pl-9 text-xs rounded-xl bg-background"
                      />
                    </div>
                    {imageUrlInput && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="h-9 px-3 text-xs text-destructive border-border/80"
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>

                {previewImage && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <img
                      src={previewImage}
                      alt="Preview Aset URL"
                      onError={() => setErrorMsg("Gagal memuat pratinjau gambar dari URL tersebut.")}
                      className="h-16 w-16 object-cover rounded-xl border border-border/60 shadow-2xs"
                    />
                    <div className="text-[11px] text-muted-foreground truncate">
                      <p className="font-semibold text-foreground">Pratinjau Gambar URL</p>
                      <p className="truncate max-w-xs">{imageUrlInput}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Persis gambar referensi */}
          <DialogFooter className="pt-3 border-t border-border/50 flex flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploadingPhoto}
              className="h-9 px-4 rounded-xl text-xs font-medium border-border/80"
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
                className="h-9 px-4 rounded-xl text-xs font-medium border-border/80"
              >
                Simpan Draf
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isUploadingPhoto}
                className="h-9 px-5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5"
              >
                {isSubmitting || isUploadingPhoto ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{isUploadingPhoto ? "Mengunggah Foto..." : "Menyimpan..."}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>{initialData ? "Simpan Perubahan" : "+ Tambah Aset"}</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
