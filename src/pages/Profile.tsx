import { useState, useEffect } from "react"
import {
  Mail,
  ShieldCheck,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { updateMyProfile } from "@/lib/api/profiles"
import { formatDateID } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth()

  const currentFullName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const [fullName, setFullName] = useState(currentFullName)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    setFullName(currentFullName)
  }, [currentFullName])

  const isDirty = fullName.trim() !== currentFullName.trim()
  const isValid = fullName.trim().length >= 2

  const handleReset = () => {
    setFullName(currentFullName)
    setFeedback(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isDirty || !isValid || isSaving) return

    try {
      setIsSaving(true)
      setFeedback(null)
      await updateMyProfile(user.id, fullName, currentFullName)
      await refreshProfile()
      setFeedback({ type: "success", message: "Profil berhasil diperbarui." })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Gagal menyimpan profil." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2500)
  }

  const roleLabel =
    role === "admin" ? "Administrator" : role === "staff" ? "Staf" : "Pengguna"
  const roleVariant = role === "admin" ? "default" : role === "staff" ? "info" : "secondary"

  const displayEmail = profile?.email || user?.email || "-"
  const joinedDate = formatDateID(profile?.created_at || user?.created_at)

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto pb-8 animate-enter">
      <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
        Profil
      </h1>

      {/* Identity Card */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
              {(fullName || "U").charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground truncate">
                  {fullName || "Pengguna"}
                </h2>
                <Badge variant={roleVariant}>{roleLabel}</Badge>
              </div>
              <p className="text-xs font-mono text-muted-foreground truncate">{displayEmail}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Bergabung {joinedDate}</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleCopyId}
            className="font-mono self-start sm:self-center"
          >
            {copiedId ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-muted-foreground" />
                <span>ID: {user?.id?.slice(0, 8)}</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {feedback && (
              <Alert variant={feedback.type === "success" ? "success" : "destructive"} className="items-center">
                {feedback.type === "success" ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span className="font-medium">{feedback.message}</span>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="full_name" className="text-xs">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  autoComplete="name"
                />
                {fullName.trim().length > 0 && fullName.trim().length < 2 && (
                  <p className="text-[11px] text-destructive">Minimal 2 karakter.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="email" type="email" value={displayEmail} readOnly disabled className="pl-8" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs">Peran</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="role" type="text" value={roleLabel} readOnly disabled className="pl-8" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={!isDirty || isSaving}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Batal</span>
              </Button>
              <Button type="submit" size="sm" disabled={!isDirty || !isValid || isSaving}>
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
