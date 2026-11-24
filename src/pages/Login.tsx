import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import {
  Package,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setResendSuccess(null)
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("Email atau kata sandi tidak sesuai.")
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMsg("Email belum dikonfirmasi.")
        } else {
          setErrorMsg(error.message || "Gagal masuk ke sistem.")
        }
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setErrorMsg("Masukkan alamat email terlebih dahulu.")
      return
    }
    setIsResending(true)
    setResendSuccess(null)
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) {
        setErrorMsg(error.message)
      } else {
        setResendSuccess(`Tautan verifikasi dikirim ulang ke ${email}.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim ulang verifikasi.")
    } finally {
      setIsResending(false)
    }
  }

  const isEmailNotConfirmed =
    errorMsg?.toLowerCase().includes("email belum dikonfirmasi") ||
    errorMsg?.toLowerCase().includes("email not confirmed")

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-8 sm:p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Stockly</h1>
        </div>

        {/* Auth Card */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium border border-border">
              <span className="py-1.5 rounded-md bg-card text-foreground font-semibold text-center shadow-sm">
                Masuk
              </span>
              <Link
                to="/register"
                className="py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Daftar
              </Link>
            </div>

            {errorMsg && (
              <Alert variant="destructive" className="flex-col items-start gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
                {isEmailNotConfirmed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                  >
                    <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                    <span>{isResending ? "Mengirim..." : "Kirim Ulang Verifikasi"}</span>
                  </Button>
                )}
              </Alert>
            )}

            {resendSuccess && (
              <Alert variant="success" className="items-center">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{resendSuccess}</span>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoComplete="current-password"
                    placeholder="Kata sandi"
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

              <Button type="submit" disabled={isSubmitting} className="w-full h-10">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? "Memproses..." : "Masuk"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
