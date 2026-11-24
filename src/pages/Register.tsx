import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types/auth"
import {
  Package,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("staff")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await signUp(email, password, fullName, role)
      if (error) {
        setErrorMsg(error.message || "Gagal mendaftarkan akun.")
      } else {
        const targetPath = role === "admin" ? "/dashboard" : "/inventory"
        setSuccessMsg("Akun berhasil dibuat. Mengalihkan...")
        setTimeout(() => {
          navigate(targetPath, { replace: true })
        }, 1200)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-8 sm:p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Stockly</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium border border-border">
              <Link
                to="/login"
                className="py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Masuk
              </Link>
              <span className="py-1.5 rounded-md bg-card text-foreground font-semibold text-center shadow-sm">
                Daftar
              </span>
            </div>

            {errorMsg && (
              <Alert variant="destructive" className="items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </Alert>
            )}

            {successMsg && (
              <Alert variant="success" className="items-center">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">Nama Lengkap</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Peran</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRole("staff")}
                    className={cn(
                      "h-10 justify-start gap-2 px-3",
                      role === "staff" && "border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Staf</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRole("admin")}
                    className={cn(
                      "h-10 justify-start gap-2 px-3",
                      role === "admin" && "border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-10">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? "Mendaftarkan..." : "Daftar"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
