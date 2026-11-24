import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Layers, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InventoryItem, CreateBorrowingPayload, BorrowingStatus } from "@/types/database"
import type { UserProfile } from "@/types/auth"

type BorrowType = "single" | "multiple"

interface BorrowingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableInventories: InventoryItem[]
  profiles: UserProfile[]
  currentUserId: string
  isAdmin: boolean
  initialInventoryId?: string
  onSubmit: (payload: CreateBorrowingPayload | CreateBorrowingPayload[]) => Promise<void>
}

export function BorrowingModal({
  open,
  onOpenChange,
  availableInventories,
  profiles,
  currentUserId,
  isAdmin,
  initialInventoryId,
  onSubmit,
}: BorrowingModalProps) {
  const [borrowType, setBorrowType] = useState<BorrowType>("single")
  const [singleInventoryId, setSingleInventoryId] = useState("")
  const [multipleInventoryIds, setMultipleInventoryIds] = useState<[string, string, string]>(["", "", ""])

  const [borrowerId, setBorrowerId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<BorrowingStatus>(isAdmin ? "Borrowed" : "Pending Approval")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!open) return

    const d = new Date()
    d.setDate(d.getDate() + 7)
    const formattedDate = d.toISOString().split("T")[0]

    setBorrowType("single")
    const targetId =
      initialInventoryId && availableInventories.some((inv) => inv.id === initialInventoryId)
        ? initialInventoryId
        : availableInventories[0]?.id || ""

    setSingleInventoryId(targetId)
    setMultipleInventoryIds([
      targetId,
      availableInventories.find((inv) => inv.id !== targetId)?.id || "",
      "",
    ])
    setBorrowerId(currentUserId || profiles[0]?.id || "")
    setDueDate(formattedDate)
    setNotes("")
    setStatus(isAdmin ? "Borrowed" : "Pending Approval")
    setErrorMsg("")
  }, [open, availableInventories, profiles, currentUserId, isAdmin, initialInventoryId])

  const singleInventoryOptions: ComboboxOption[] = availableInventories.map((inv) => ({
    value: inv.id,
    label: inv.name,
    badge: inv.code,
    sublabel: `Stok ${inv.quantity} · ${inv.location || "Gudang"}`,
  }))

  const getMultipleOptionsForSlot = (slotIndex: number): ComboboxOption[] => {
    return availableInventories.map((inv) => {
      const selectedInOtherSlots = multipleInventoryIds.filter(
        (id, idx) => idx !== slotIndex && id === inv.id
      ).length
      const remainingStock = Math.max(0, (inv.quantity || 0) - selectedInOtherSlots)
      const isDisabled = remainingStock <= 0

      return {
        value: inv.id,
        label: inv.name,
        badge: inv.code,
        sublabel: isDisabled ? "Stok habis di slot lain" : `Sisa ${remainingStock} unit`,
        disabled: isDisabled,
      }
    })
  }

  const handleMultipleSlotChange = (slotIndex: number, val: string) => {
    const updated: [string, string, string] = [...multipleInventoryIds]
    updated[slotIndex] = val
    setMultipleInventoryIds(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!borrowerId) {
      setErrorMsg("Peminjam wajib dipilih.")
      return
    }
    if (!dueDate) {
      setErrorMsg("Tenggat waktu wajib diisi.")
      return
    }

    if (borrowType === "single") {
      if (!singleInventoryId) {
        setErrorMsg("Pilih aset yang ingin dipinjam.")
        return
      }
      try {
        setIsSubmitting(true)
        setErrorMsg("")
        await onSubmit({
          inventory_id: singleInventoryId,
          borrower_id: borrowerId,
          due_date: dueDate,
          notes: notes || null,
          status,
        })
        onOpenChange(false)
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal mencatat peminjaman.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      const selectedIds = multipleInventoryIds.filter(Boolean)
      if (!multipleInventoryIds[0] || !multipleInventoryIds[1] || selectedIds.length < 2) {
        setErrorMsg("Pilih minimal 2 aset.")
        return
      }

      for (const inv of availableInventories) {
        const count = selectedIds.filter((id) => id === inv.id).length
        if (count > (inv.quantity || 0)) {
          setErrorMsg(`Stok "${inv.name}" tidak mencukupi (tersedia ${inv.quantity}).`)
          return
        }
      }

      try {
        setIsSubmitting(true)
        setErrorMsg("")
        await onSubmit(
          selectedIds.map((invId) => ({
            inventory_id: invId,
            borrower_id: borrowerId,
            due_date: dueDate,
            notes: notes || null,
            status,
          }))
        )
        onOpenChange(false)
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal mencatat peminjaman.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const profileOptions: ComboboxOption[] = profiles.map((p) => ({
    value: p.id,
    label: p.full_name || p.email,
    sublabel: p.email,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pinjam Aset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
          {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

          {/* Single vs Multi Mode */}
          <Tabs
            value={borrowType}
            onValueChange={(val) => {
              if (val === "single" || val === "multiple") {
                setBorrowType(val)
                setErrorMsg("")
              }
            }}
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="single">
                <Package className="h-3.5 w-3.5" />
                <span>1 Barang</span>
              </TabsTrigger>
              <TabsTrigger value="multiple">
                <Layers className="h-3.5 w-3.5" />
                <span>Multi Aset</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Asset Selection */}
          {availableInventories.length === 0 ? (
            <Alert variant="warning">Belum ada aset tersedia untuk dipinjam.</Alert>
          ) : borrowType === "single" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Aset <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={singleInventoryOptions}
                value={singleInventoryId}
                onChange={setSingleInventoryId}
                placeholder="Pilih aset..."
                searchPlaceholder="Cari nama atau kode..."
              />
            </div>
          ) : (
            <div className="space-y-2.5 p-3.5 rounded-lg bg-muted/40 border border-border">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Aset {idx + 1}</Label>
                    <Badge variant={idx < 2 ? "destructive" : "outline"}>
                      {idx < 2 ? "Wajib" : "Opsional"}
                    </Badge>
                  </div>
                  <Combobox
                    options={getMultipleOptionsForSlot(idx)}
                    value={multipleInventoryIds[idx]}
                    onChange={(val) => handleMultipleSlotChange(idx, val)}
                    placeholder={`Pilih aset ${idx + 1}...`}
                    searchPlaceholder="Cari nama atau kode..."
                    clearable={idx === 2}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Borrower & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Peminjam <span className="text-destructive">*</span>
              </Label>
              {isAdmin ? (
                <Combobox
                  options={profileOptions}
                  value={borrowerId}
                  onChange={setBorrowerId}
                  placeholder="Pilih peminjam..."
                  searchPlaceholder="Cari nama atau email..."
                />
              ) : (
                <Input
                  value={profiles.find((p) => p.id === borrowerId)?.full_name || "Akun Saya"}
                  readOnly
                  disabled
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Tenggat Kembali <span className="text-destructive">*</span>
              </Label>
              <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pilih tanggal" />
            </div>
          </div>

          {/* Initial Status (Admin only) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <Label className="text-xs">Status Awal</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setStatus("Borrowed")}
                  className={cn(
                    "rounded-full h-7 px-3 gap-1.5",
                    status === "Borrowed" && "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Langsung Dipinjam</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setStatus("Pending Approval")}
                  className={cn(
                    "rounded-full h-7 px-3 gap-1.5",
                    status === "Pending Approval" && "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Menunggu Persetujuan</span>
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Catatan</Label>
            <Input
              id="notes"
              placeholder="Keperluan peminjaman (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || availableInventories.length === 0}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isAdmin ? "Catat Peminjaman" : "Kirim Permohonan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
