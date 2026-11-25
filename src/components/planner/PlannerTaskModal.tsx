import { useState } from "react"
import { Loader2, Check } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DEFAULT_CHANNELS,
  PLANNER_PRIORITIES,
  PLANNER_STATUSES,
  PRIORITY_META,
  STATUS_META,
  fromDateInputValue,
  getInitials,
  toDateInputValue,
} from "./plannerConfig"
import type {
  CreatePlannerTaskPayload,
  PlannerTask,
  PlannerTaskPriority,
  PlannerTaskStatus,
} from "@/types/database"
import type { UserProfile } from "@/types/auth"

interface PlannerTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTask?: PlannerTask | null
  defaultStatus?: PlannerTaskStatus
  defaultDueDate?: string
  profiles: UserProfile[]
  isSubmitting: boolean
  onSubmit: (payload: CreatePlannerTaskPayload) => Promise<void>
}

export function PlannerTaskModal({
  open,
  onOpenChange,
  initialTask,
  defaultStatus = "Not Started",
  defaultDueDate = "",
  profiles,
  isSubmitting,
  onSubmit,
}: PlannerTaskModalProps) {
  const isEdit = Boolean(initialTask)

  const [title, setTitle] = useState(initialTask?.title || "")
  const [subtitle, setSubtitle] = useState(initialTask?.subtitle || "")
  const [channel, setChannel] = useState(initialTask?.channel || "")
  const [status, setStatus] = useState<PlannerTaskStatus>(
    initialTask?.status || defaultStatus
  )
  const [priority, setPriority] = useState<PlannerTaskPriority>(
    initialTask?.priority || "Medium"
  )
  const [startDate, setStartDate] = useState(toDateInputValue(initialTask?.start_date))
  const [dueDate, setDueDate] = useState(
    initialTask ? toDateInputValue(initialTask.due_date) : defaultDueDate
  )
  const [tagsInput, setTagsInput] = useState(
    initialTask?.tags?.length ? initialTask.tags.join(", ") : ""
  )
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    initialTask?.assignees?.map((a) => a.profile_id) || []
  )
  const [description, setDescription] = useState(initialTask?.description || "")
  const [formError, setFormError] = useState<string | null>(null)

  const toggleAssignee = (profileId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError("Judul tugas wajib diisi.")
      return
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setFormError("Tanggal mulai tidak boleh melebihi tanggal tenggat.")
      return
    }

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        title: trimmedTitle,
        subtitle: subtitle.trim() || null,
        channel: channel.trim() || null,
        status,
        priority,
        start_date: fromDateInputValue(startDate),
        due_date: fromDateInputValue(dueDate),
        tags: parsedTags,
        assignee_ids: selectedAssignees,
        description: description.trim() || null,
      })
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan tugas. Silakan coba lagi."
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Tugas (${initialTask?.task_code})` : "Buat Tugas Planner Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi rencana konten, jadwal, prioritas, atau penanggung jawab."
              : "Isi detail rencana konten atau tugas operasional untuk ditambahkan ke papan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="planner-title">Judul Tugas *</Label>
            <Input
              id="planner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kampanye Produk Kuartal 4"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planner-subtitle">Sub-judul / Kategori</Label>
              <Input
                id="planner-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Contoh: Halaman Utama"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planner-channel">Kanal / Platform</Label>
              <Input
                id="planner-channel"
                list="planner-channel-suggestions"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="Website, Instagram, Internal..."
              />
              <datalist id="planner-channel-suggestions">
                {DEFAULT_CHANNELS.map((ch) => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v as PlannerTaskStatus) || "Not Started")}
              >
                <SelectTrigger aria-label="Pilih status tugas">
                  <SelectValue>{STATUS_META[status].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLANNER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Prioritas</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority((v as PlannerTaskPriority) || "Medium")}
              >
                <SelectTrigger aria-label="Pilih prioritas tugas">
                  <SelectValue>{PRIORITY_META[priority].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLANNER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planner-start-date">Tanggal Mulai</Label>
              <Input
                id="planner-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planner-due-date">Tanggal Tenggat</Label>
              <Input
                id="planner-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planner-tags">Label / Tag (pisahkan dengan koma)</Label>
            <Input
              id="planner-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Desain, Konten, Review"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Penanggung Jawab ({selectedAssignees.length} dipilih)</Label>
            {profiles.length === 0 ? (
              <p className="text-xs text-muted-foreground">Daftar pengguna belum tersedia.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-muted/25 max-h-28 overflow-y-auto">
                {profiles.map((profile) => {
                  const isSelected = selectedAssignees.includes(profile.id)
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => toggleAssignee(profile.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      )}
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                        {isSelected ? <Check className="h-2.5 w-2.5" /> : getInitials(profile.full_name)}
                      </span>
                      <span>{profile.full_name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planner-description">Catatan / Brief Konten</Label>
            <Textarea
              id="planner-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan deskripsi tugas, target audiens, atau daftar periksa..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEdit ? "Simpan Perubahan" : "Simpan Tugas"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
