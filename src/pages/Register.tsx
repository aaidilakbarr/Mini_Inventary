import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'
import { 
  Package, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
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
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await signUp(email, password, fullName, role)
      if (error) {
        setErrorMsg(error.message || 'Failed to create account.')
      } else {
        setSuccessMsg('Account registered successfully! Redirecting to dashboard...')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1200)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden antialiased">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 mb-1">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">INV.HUB</span>
            <Badge variant="outline" className="text-[10px] uppercase font-semibold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
              RBAC Setup
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Create an account with role-based system access
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl p-6 sm:p-8 space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium">
            <Link
              to="/login"
              className="py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all text-center"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="py-1.5 rounded-md bg-card text-foreground font-semibold shadow-xs transition-all text-center"
            >
              Register
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Create Your Account</h2>
            <p className="text-xs text-muted-foreground">
              Fill in your details and select your initial permission role.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium">{successMsg}</p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Aidil Pratama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 h-10 text-xs bg-muted/30 border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs bg-muted/30 border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 text-xs bg-muted/30 border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* RBAC Role Selector Cards */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-foreground">
                Select Initial Role
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => setRole('staff')}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between space-y-1",
                    role === 'staff'
                      ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs"
                      : "border-border/70 hover:border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className={cn("h-4 w-4", role === 'staff' ? "text-primary font-bold" : "text-muted-foreground")} />
                      <span className="text-xs font-bold text-foreground">Staff</span>
                    </div>
                    {role === 'staff' && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Inventory tracking & borrow requests.
                  </p>
                </div>

                <div
                  onClick={() => setRole('admin')}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between space-y-1",
                    role === 'admin'
                      ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs"
                      : "border-border/70 hover:border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className={cn("h-4 w-4", role === 'admin' ? "text-primary font-bold" : "text-muted-foreground")} />
                      <span className="text-xs font-bold text-foreground">Admin</span>
                    </div>
                    {role === 'admin' && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Approvals, audit logs & settings.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 text-xs font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 mt-3"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Registering user...</span>
                </div>
              ) : (
                <>
                  <span>Create {role === 'admin' ? 'Administrator' : 'Staff'} Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="pt-2 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
