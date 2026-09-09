import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Lock, 
  Copy, 
  KeyRound, 
  Camera, 
  Smartphone,
  Calendar,
  Sparkles
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { updateMyProfile } from "@/lib/api/profiles"
import { formatDateID } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth()
  
  const currentFullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const [fullName, setFullName] = useState(currentFullName)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Sync state whenever profile context changes
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

      setFeedback({
        type: "success",
        message: "Profil berhasil diperbarui! Perubahan telah diterapkan di seluruh sistem.",
      })

      // Auto dismiss success feedback after 4 seconds
      setTimeout(() => {
        setFeedback(null)
      }, 4000)
    } catch (err: any) {
      console.error("Gagal menyimpan profil:", err)
      setFeedback({
        type: "error",
        message: err?.message || "Terjadi kendala saat menyimpan profil. Silakan coba kembali.",
      })
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

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return {
          label: "Administrator",
          classes: "bg-primary/10 text-primary border-primary/20",
        }
      case "staff":
        return {
          label: "Staff Operasional",
          classes: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
        }
      default:
        return {
          label: "Pengguna Umum",
          classes: "bg-slate-500/10 text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700",
        }
    }
  }

  const roleInfo = getRoleBadgeVariant(role)
  const displayEmail = profile?.email || user?.email || "-"
  const joinedDate = formatDateID(profile?.created_at || user?.created_at)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Profil Pengguna
          </h1>
          <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono gap-1 text-primary border-primary/30 bg-primary/5 rounded-full">
            <User className="h-3 w-3" />
            <span>Akun Saya</span>
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Kelola informasi identitas akun Anda dan pantau status otorisasi peran sistem.
        </p>
      </div>

      {/* Profile Overview Header Card */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar with initial */}
            <div className="relative">
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-extrabold text-2xl shadow-md shadow-primary/25 border border-primary/30">
                {(fullName || "U").charAt(0).toUpperCase()}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center"
                title="Status Akun: Aktif"
              >
                <span className="sr-only">Status Aktif</span>
              </div>
            </div>

            {/* Name, Email, and Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {fullName || "Nama Belum Diatur"}
                </h2>
                <Badge variant="outline" className={`h-5 text-[11px] font-medium border ${roleInfo.classes}`}>
                  {roleInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {displayEmail}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Bergabung: {joinedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick ID Copy Button */}
          <div className="sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/70 transition-colors"
              title="Salin User ID"
            >
              {copiedId ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">User ID Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>ID: {user?.id?.slice(0, 8)}...</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Main Form: Basic Info */}
      <form onSubmit={handleSubmit}>
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Informasi Identitas Pengguna</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ubah nama tampilan yang digunakan pada tanda tangan peminjaman, log audit, dan kop laporan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Feedback Alert */}
            {feedback && (
              <div 
                className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
                  feedback.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {feedback.type === "success" ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Full Name (Editable) */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="full_name" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Nama Lengkap <span className="text-destructive">*</span></span>
                  {isDirty && (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                      Ada perubahan belum disimpan
                    </span>
                  )}
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs bg-background focus-visible:ring-primary/20"
                  disabled={isSaving}
                  autoComplete="name"
                />
                <p className="text-[11px] text-muted-foreground">
                  Gunakan nama asli yang resmi agar dapat diidentifikasi saat melakukan peminjaman barang dan persetujuan operasional.
                </p>
                {fullName.trim().length > 0 && fullName.trim().length < 2 && (
                  <p className="text-[11px] text-destructive">
                    Nama lengkap harus memiliki minimal 2 karakter.
                  </p>
                )}
              </div>

              {/* Field 2: Email (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Alamat Email Akun
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Terkunci</span>
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    value={displayEmail}
                    readOnly
                    disabled
                    className="h-9 text-xs pl-8 bg-muted/40 text-muted-foreground cursor-not-allowed border-dashed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Email terkait langsung dengan kredensial login Supabase.
                </p>
              </div>

              {/* Field 3: Role (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="role" className="text-xs font-semibold text-foreground">
                    Tingkat Otorisasi (Peran)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Terkunci</span>
                  </span>
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    id="role"
                    type="text"
                    value={roleInfo.label}
                    readOnly
                    disabled
                    className="h-9 text-xs pl-8 bg-muted/40 text-muted-foreground cursor-not-allowed border-dashed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hak akses dikelola terpusat oleh Administrator pada menu Pengaturan Sistem.
                </p>
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground">
                {isDirty ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Tekan Simpan untuk memperbarui profil.
                  </span>
                ) : (
                  <span>Data profil tersinkronisasi.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!isDirty || isSaving}
                  className="h-8 text-xs font-medium gap-1.5 border-border/80"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Batal</span>
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!isDirty || !isValid || isSaving}
                  className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Future Roadmap / Additional Settings (Graceful Inactive Placeholders) */}
      <Card className="border-border/60 bg-muted/20 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Pengaturan Akun Lanjutan (Fase Berikutnya)</span>
          </CardTitle>
          <CardDescription className="text-[11px]">
            Fitur berikut sedang dipersiapkan untuk peningkatan keamanan dan personalisasi akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Placeholder 1: Password */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 opacity-75 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="h-4 text-[9px] font-mono uppercase bg-muted">
                  Segera
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Ganti Kata Sandi</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pembaruan password login secara mandiri.</p>
              </div>
            </div>

            {/* Placeholder 2: Avatar Upload */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 opacity-75 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="h-4 text-[9px] font-mono uppercase bg-muted">
                  Segera
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Unggah Foto Profil</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ganti inisial dengan foto avatar kustom.</p>
              </div>
            </div>

            {/* Placeholder 3: Active Sessions */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 opacity-75 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="h-4 text-[9px] font-mono uppercase bg-muted">
                  Segera
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Sesi Login Aktif</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pantau peramban dan perangkat terhubung.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
