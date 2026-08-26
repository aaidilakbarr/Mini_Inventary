import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setResendSuccess(null)
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Email atau kata sandi tidak sesuai.')
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Email belum dikonfirmasi di Supabase.')
        } else {
          setErrorMsg(error.message || 'Terjadi kesalahan saat masuk.')
        }
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan yang tidak terduga.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setErrorMsg('Silakan masukkan alamat email Anda terlebih dahulu.')
      return
    }
    setIsResending(true)
    setResendSuccess(null)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        setResendSuccess(`Link verifikasi telah dikirim ulang ke ${email}. Silakan periksa kotak masuk atau spam email Anda.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email konfirmasi.')
    } finally {
      setIsResending(false)
    }
  }

  const isEmailNotConfirmed = errorMsg?.toLowerCase().includes('email belum dikonfirmasi') || errorMsg?.toLowerCase().includes('email not confirmed')

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden antialiased">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 mb-1">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">INV.HUB</span>
            <Badge variant="outline" className="text-[10px] uppercase font-semibold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
              v1.0
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Sistem Manajemen Aset & Pengingat Otomatis
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl p-6 sm:p-8 space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium">
            <button
              type="button"
              className="py-1.5 rounded-md bg-card text-foreground font-semibold shadow-xs transition-all text-center"
            >
              Masuk
            </button>
            <Link
              to="/register"
              className="py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all text-center"
            >
              Daftar
            </Link>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Masuk ke Ruang Kerja</h2>
            <p className="text-xs text-muted-foreground">
              Masukkan email dan kata sandi terdaftar untuk melanjutkan.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-snug font-medium">{errorMsg}</p>
              </div>

              {isEmailNotConfirmed && (
                <div className="pt-2 border-t border-destructive/20 flex flex-col gap-2">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Fitur verifikasi email aktif pada Supabase. Periksa kotak masuk Anda atau minta link konfirmasi baru di bawah ini:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 w-fit gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Mengirim Link...' : 'Kirim Ulang Link Konfirmasi'}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Resend Success Banner */}
          {resendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium">{resendSuccess}</p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs bg-muted/30 border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 text-xs bg-muted/30 border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 text-xs font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Sedang masuk...</span>
                </div>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="pt-2 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Belum memiliki akun?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
