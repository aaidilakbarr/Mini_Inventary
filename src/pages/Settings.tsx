import { useState, useEffect, useCallback } from "react"
import { 
  Building2, 
  ArrowLeftRight, 
  BellRing, 
  Send, 
  Tag, 
  Users, 
  Save, 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Check,
  Mail,
  MessageSquare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories"
import { fetchProfiles, updateUserProfileRole } from "@/lib/api/profiles"
import { recordAuditLog } from "@/lib/api/auditLogs"
import { formatDateID } from "@/lib/formatters"
import { useAuth } from "@/hooks/useAuth"
import type { Category } from "@/types/database"
import type { UserProfile, UserRole } from "@/types/auth"

export function SettingsPage() {
  const { profile: currentAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<"organization" | "borrowing" | "reminders" | "notifications" | "categories" | "users">("organization")

  // Organization state
  const [orgName, setOrgName] = useState(() => localStorage.getItem("setting_org_name") || "PT. Sinergi Inovasi Digital")
  const [orgAddress, setOrgAddress] = useState(() => localStorage.getItem("setting_org_address") || "Gedung Cyber 2 Lantai 15, Jl. HR Rasuna Said, Jakarta")
  const [orgEmail, setOrgEmail] = useState(() => localStorage.getItem("setting_org_email") || "admin@sinergidigital.co.id")
  const [orgLogo, setOrgLogo] = useState(() => localStorage.getItem("setting_org_logo") || "")

  // Borrowing Rules state
  const [defaultLoanDays, setDefaultLoanDays] = useState(() => localStorage.getItem("setting_loan_days") || "7")
  const [maxItemsPerUser, setMaxItemsPerUser] = useState(() => localStorage.getItem("setting_max_items") || "3")
  const [gracePeriodDays, setGracePeriodDays] = useState(() => localStorage.getItem("setting_grace_period") || "1")
  const [requireApproval, setRequireApproval] = useState(() => localStorage.getItem("setting_require_approval") !== "false")

  // Reminder Automation Thresholds state
  const [warrantyLeadDays, setWarrantyLeadDays] = useState(() => localStorage.getItem("setting_warranty_lead") || "30")
  const [borrowingLeadDays, setBorrowingLeadDays] = useState(() => localStorage.getItem("setting_borrowing_lead") || "3")
  const [subscriptionLeadDays, setSubscriptionLeadDays] = useState(() => localStorage.getItem("setting_subscription_lead") || "7")

  // Notification Channels state
  const [inAppActive, setInAppActive] = useState(() => localStorage.getItem("setting_inapp_active") !== "false")
  const [smtpHost, setSmtpHost] = useState(() => localStorage.getItem("setting_smtp_host") || "smtp.resend.com")
  const [smtpSender, setSmtpSender] = useState(() => localStorage.getItem("setting_smtp_sender") || "system@invhub.internal")
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem("setting_tg_token") || "")
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem("setting_tg_chat_id") || "")
  const [whatsappEndpoint, setWhatsappEndpoint] = useState(() => localStorage.getItem("setting_wa_endpoint") || "")

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testSuccess, setTestSuccess] = useState<string | null>(null)

  // Master Data: Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingCat, setIsDeletingCat] = useState(false)

  // Master Data: Users & Roles
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error("Gagal memuat kategori:", err)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true)
      const data = await fetchProfiles()
      setUsers(data)
    } catch (err) {
      console.error("Gagal memuat daftar pengguna:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "categories") {
      loadCategories()
    } else if (activeTab === "users") {
      loadUsers()
    }
  }, [activeTab, loadCategories, loadUsers])

  const handleSaveOrganization = () => {
    localStorage.setItem("setting_org_name", orgName)
    localStorage.setItem("setting_org_address", orgAddress)
    localStorage.setItem("setting_org_email", orgEmail)
    localStorage.setItem("setting_org_logo", orgLogo)

    recordAuditLog({
      action: "UPDATE_SYSTEM_SETTINGS",
      entity_type: "settings",
      details: {
        section: "organization",
        org_name: orgName,
        org_email: orgEmail,
      }
    })

    triggerSaveToast()
  }

  const handleSaveBorrowingRules = () => {
    localStorage.setItem("setting_loan_days", defaultLoanDays)
    localStorage.setItem("setting_max_items", maxItemsPerUser)
    localStorage.setItem("setting_grace_period", gracePeriodDays)
    localStorage.setItem("setting_require_approval", String(requireApproval))

    recordAuditLog({
      action: "UPDATE_SYSTEM_SETTINGS",
      entity_type: "settings",
      details: {
        section: "borrowing_rules",
        default_loan_days: defaultLoanDays,
        max_items: maxItemsPerUser,
        grace_period_days: gracePeriodDays,
        require_approval: requireApproval
      }
    })

    triggerSaveToast()
  }

  const handleSaveReminderRules = () => {
    localStorage.setItem("setting_warranty_lead", warrantyLeadDays)
    localStorage.setItem("setting_borrowing_lead", borrowingLeadDays)
    localStorage.setItem("setting_subscription_lead", subscriptionLeadDays)

    recordAuditLog({
      action: "UPDATE_SYSTEM_SETTINGS",
      entity_type: "settings",
      details: {
        section: "reminder_thresholds",
        warranty_lead_days: warrantyLeadDays,
        borrowing_lead_days: borrowingLeadDays,
        subscription_lead_days: subscriptionLeadDays
      }
    })

    triggerSaveToast()
  }

  const handleSaveNotifications = () => {
    localStorage.setItem("setting_inapp_active", String(inAppActive))
    localStorage.setItem("setting_smtp_host", smtpHost)
    localStorage.setItem("setting_smtp_sender", smtpSender)
    localStorage.setItem("setting_tg_token", telegramToken)
    localStorage.setItem("setting_tg_chat_id", telegramChatId)
    localStorage.setItem("setting_wa_endpoint", whatsappEndpoint)

    recordAuditLog({
      action: "UPDATE_SYSTEM_SETTINGS",
      entity_type: "settings",
      details: {
        section: "notifications",
        in_app_active: inAppActive,
        smtp_host: smtpHost,
        telegram_configured: !!telegramToken,
      }
    })

    triggerSaveToast()
  }

  const triggerSaveToast = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleTestNotification = (channel: string) => {
    setTestSuccess(`Uji kirim notifikasi ${channel} berhasil diantrikan!`)
    setTimeout(() => setTestSuccess(null), 4000)
  }

  // Category Actions
  const handleCategorySubmit = async (name: string, type: 'inventory' | 'subscription' | 'general', description?: string) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, name, type, description)
      recordAuditLog({
        action: "UPDATE",
        entity_type: "category",
        entity_id: editingCategory.id,
        details: { name, type, description }
      })
    } else {
      const created = await createCategory(name, type, description)
      recordAuditLog({
        action: "CREATE",
        entity_type: "category",
        entity_id: created?.id,
        details: { name, type, description }
      })
    }
    await loadCategories()
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    try {
      setIsDeletingCat(true)
      await deleteCategory(deletingCategory.id)
      recordAuditLog({
        action: "DELETE",
        entity_type: "category",
        entity_id: deletingCategory.id,
        details: { name: deletingCategory.name, type: deletingCategory.type }
      })
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
      await loadCategories()
    } catch (err) {
      console.error("Gagal menghapus kategori:", err)
    } finally {
      setIsDeletingCat(false)
    }
  }

  // User Role Actions
  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.id === currentAdmin?.id && newRole === 'staff') {
      alert("Anda tidak dapat menurunkan role akun administrator Anda sendiri saat sedang aktif.")
      return
    }

    try {
      setUpdatingUserId(targetUser.id)
      await updateUserProfileRole(targetUser.id, newRole)
      recordAuditLog({
        action: "UPDATE_USER_ROLE",
        entity_type: "profile",
        entity_id: targetUser.id,
        details: {
          user_email: targetUser.email,
          user_name: targetUser.full_name,
          old_role: targetUser.role,
          new_role: newRole
        }
      })
      await loadUsers()
    } catch (err: any) {
      alert(err?.message || "Gagal memperbarui peran pengguna.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const tabs = [
    { id: "organization", label: "Profil Organisasi", icon: Building2 },
    { id: "borrowing", label: "Aturan Peminjaman", icon: ArrowLeftRight },
    { id: "reminders", label: "Otomasi Pengingat", icon: BellRing },
    { id: "notifications", label: "Saluran Notifikasi", icon: Send },
    { id: "categories", label: "Master Kategori", icon: Tag },
    { id: "users", label: "Manajemen Pengguna", icon: Users },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Pengaturan Sistem
            </h1>
            <Badge variant="outline" className="h-5 px-2.5 text-[10px] font-mono gap-1 text-primary border-primary/30 bg-primary/5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Mode</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola preferensi instansi, parameter aturan peminjaman, ambang batas pengingat, dan delegasi peran pengguna.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>

      {testSuccess && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 overflow-x-auto pb-1 select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-1 ${
                isActive
                  ? "border-primary text-primary font-semibold bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: Organization Profile */}
      {activeTab === "organization" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Identitas & Profil Organisasi</CardTitle>
            <CardDescription className="text-xs">
              Informasi identitas instansi yang digunakan pada kop dashboard, laporan ekspor, dan email notifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className="text-xs font-semibold">Nama Organisasi / Perusahaan</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-email" className="text-xs font-semibold">Email Kontak Administrator</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="org-address" className="text-xs font-semibold">Alamat Kantor / Kantor Pusat</Label>
                <Input
                  id="org-address"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="org-logo" className="text-xs font-semibold">URL Logo Instansi (Opsional)</Label>
                <Input
                  id="org-logo"
                  placeholder="https://domain.com/logo.png"
                  value={orgLogo}
                  onChange={(e) => setOrgLogo(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <Button size="sm" onClick={handleSaveOrganization} className="h-8 text-xs font-medium gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Borrowing Rules */}
      {activeTab === "borrowing" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Parameter & Aturan Peminjaman Aset</CardTitle>
            <CardDescription className="text-xs">
              Konfigurasi kebijakan masa peminjaman, kuota peminjam, dan toleransi keterlambatan (overdue).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="loan-days" className="text-xs font-semibold">Default Masa Pinjam (Hari)</Label>
                <Input
                  id="loan-days"
                  type="number"
                  min="1"
                  max="90"
                  value={defaultLoanDays}
                  onChange={(e) => setDefaultLoanDays(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
                <p className="text-[10px] text-muted-foreground">Durasi standar saat staf mengajukan pinjaman.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-items" className="text-xs font-semibold">Batas Maksimal Unit per User</Label>
                <Input
                  id="max-items"
                  type="number"
                  min="1"
                  max="10"
                  value={maxItemsPerUser}
                  onChange={(e) => setMaxItemsPerUser(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
                <p className="text-[10px] text-muted-foreground">Maksimal barang aktif yang boleh dipinjam bersamaan.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grace-days" className="text-xs font-semibold">Grace Period Overdue (Hari)</Label>
                <Input
                  id="grace-days"
                  type="number"
                  min="0"
                  max="7"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className="h-8 text-xs bg-muted/40"
                />
                <p className="text-[10px] text-muted-foreground">Toleransi sebelum status ditandai terlambat.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Wajib Persetujuan Admin</p>
                <p className="text-[11px] text-muted-foreground">Semua pengajuan peminjaman oleh staf harus diverifikasi oleh Admin.</p>
              </div>
              <Button
                variant={requireApproval ? "default" : "outline"}
                size="sm"
                onClick={() => setRequireApproval(!requireApproval)}
                className="h-7 text-xs"
              >
                {requireApproval ? "Aktif (Wajib Review)" : "Non-aktif (Auto Approve)"}
              </Button>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <Button size="sm" onClick={handleSaveBorrowingRules} className="h-8 text-xs font-medium gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Aturan Peminjaman</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Reminders Automation */}
      {activeTab === "reminders" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Ambang Batas & Otomasi Pengingat (Lead Time)</CardTitle>
            <CardDescription className="text-xs">
              Tentukan berapa hari sebelum jatuh tempo sistem akan otomatis memicu status pengingat (*Due Soon / Upcoming*).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Garansi Aset</span>
                </div>
                <Label htmlFor="warranty-lead" className="text-[11px] text-muted-foreground">
                  Peringatan Awal (Hari Sebelum Habis)
                </Label>
                <Input
                  id="warranty-lead"
                  type="number"
                  min="1"
                  max="90"
                  value={warrantyLeadDays}
                  onChange={(e) => setWarrantyLeadDays(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Default: 30 hari sebelum garansi berakhir.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 font-semibold">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Jatuh Tempo Pinjam</span>
                </div>
                <Label htmlFor="borrow-lead" className="text-[11px] text-muted-foreground">
                  Peringatan Pengembalian (H-X)
                </Label>
                <Input
                  id="borrow-lead"
                  type="number"
                  min="1"
                  max="14"
                  value={borrowingLeadDays}
                  onChange={(e) => setBorrowingLeadDays(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Default: 3 hari sebelum due date.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <Building2 className="h-4 w-4" />
                  <span>Tagihan Langganan</span>
                </div>
                <Label htmlFor="sub-lead" className="text-[11px] text-muted-foreground">
                  Peringatan Perpanjangan (H-X)
                </Label>
                <Input
                  id="sub-lead"
                  type="number"
                  min="1"
                  max="30"
                  value={subscriptionLeadDays}
                  onChange={(e) => setSubscriptionLeadDays(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Default: 7 hari sebelum renewal billing.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <Button size="sm" onClick={handleSaveReminderRules} className="h-8 text-xs font-medium gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Pengaturan Pengingat</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Notification Channels */}
      {activeTab === "notifications" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Integrasi Saluran Notifikasi Eksternal</CardTitle>
            <CardDescription className="text-xs">
              Konfigurasi webhook dan gateway untuk pengiriman peringatan realtime (*In-App, Email, Telegram, WhatsApp*).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* In-App Notifications */}
            <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Notifikasi In-App (Dashboard)</p>
                <p className="text-[11px] text-muted-foreground">Menampilkan banner peringatan dan badge counter realtime di sidebar.</p>
              </div>
              <Button
                variant={inAppActive ? "default" : "outline"}
                size="sm"
                onClick={() => setInAppActive(!inAppActive)}
                className="h-7 text-xs"
              >
                {inAppActive ? "Aktif" : "Non-aktif"}
              </Button>
            </div>

            {/* Email SMTP */}
            <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Email Gateway (SMTP / Resend)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleTestNotification("Email")} className="h-6 text-[10px]">
                  Uji Kirim Email
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">SMTP Server / Host</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Sender Email</Label>
                  <Input value={smtpSender} onChange={(e) => setSmtpSender(e.target.value)} className="h-8 text-xs bg-background" />
                </div>
              </div>
            </div>

            {/* Telegram Bot */}
            <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>Telegram Bot Alert</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleTestNotification("Telegram")} className="h-6 text-[10px]">
                  Uji Kirim Telegram
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Bot Token</Label>
                  <Input 
                    type="password"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" 
                    value={telegramToken} 
                    onChange={(e) => setTelegramToken(e.target.value)} 
                    className="h-8 text-xs bg-background" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Target Group / Chat ID</Label>
                  <Input 
                    placeholder="-100123456789" 
                    value={telegramChatId} 
                    onChange={(e) => setTelegramChatId(e.target.value)} 
                    className="h-8 text-xs bg-background" 
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Gateway */}
            <div className="p-3.5 rounded-lg bg-muted/30 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Send className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp Gateway (Fonnte / Waha)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleTestNotification("WhatsApp")} className="h-6 text-[10px]">
                  Uji Kirim WA
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">API Endpoint Webhook URL</Label>
                <Input 
                  placeholder="https://api.fonnte.com/send" 
                  value={whatsappEndpoint} 
                  onChange={(e) => setWhatsappEndpoint(e.target.value)} 
                  className="h-8 text-xs bg-background" 
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <Button size="sm" onClick={handleSaveNotifications} className="h-8 text-xs font-medium gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Pengaturan Notifikasi</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Categories Master Data */}
      {activeTab === "categories" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Master Kategori Aset & Layanan</CardTitle>
              <CardDescription className="text-xs">
                Kelola kategori pengelompokan yang tersedia pada formulir inventaris aset dan langganan.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null)
                setIsCategoryModalOpen(true)
              }}
              className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Kategori</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-foreground">Nama Kategori</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Tipe Modul</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Deskripsi</TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-semibold text-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCategories ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                        <p className="text-xs text-muted-foreground mt-2">Memuat daftar kategori...</p>
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                        Belum ada kategori terdaftar. Silakan tambahkan kategori baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} className="border-b border-border/60">
                        <TableCell className="font-semibold text-foreground">{cat.name}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`font-mono text-[10px] uppercase ${
                              cat.type === 'inventory' 
                                ? 'bg-primary/10 text-primary border-primary/20' 
                                : cat.type === 'subscription'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {cat.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingCategory(cat)
                                setIsCategoryModalOpen(true)
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive/80"
                              onClick={() => {
                                setDeletingCategory(cat)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 6: User Management & RBAC */}
      {activeTab === "users" && (
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Manajemen Pengguna & Otorisasi Peran (RBAC)</CardTitle>
            <CardDescription className="text-xs">
              Kelola hak akses pengguna sistem. Perubahan peran akan langsung memperbarui hak akses operasional dan visibilitas audit log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-foreground">Pengguna</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Terdaftar Pada</TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold text-foreground">Peran (Role)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                        <p className="text-xs text-muted-foreground mt-2">Memuat daftar pengguna...</p>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                        Tidak ada pengguna terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === currentAdmin?.id
                      const isUpdating = updatingUserId === u.id

                      return (
                        <TableRow key={u.id} className="border-b border-border/60">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground leading-tight flex items-center gap-1.5">
                                  {u.full_name}
                                  {isSelf && (
                                    <span className="text-[9px] font-mono px-1 py-0.2 bg-primary/10 text-primary rounded border border-primary/20">
                                      Anda
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{u.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.created_at ? formatDateID(u.created_at) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={u.role}
                                onValueChange={(newRole) => {
                                  if (newRole) handleRoleChange(u, newRole as UserRole)
                                }}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="h-7 text-xs bg-muted/40 border-border/80 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin (Full)</SelectItem>
                                  <SelectItem value="staff">Staff (Operator)</SelectItem>
                                  <SelectItem value="user">User (Viewer)</SelectItem>
                                </SelectContent>
                              </Select>

                              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={handleCategorySubmit}
        initialData={editingCategory}
      />

      {/* Delete Category Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Kategori"
        description={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Aset yang terkait dengan kategori ini mungkin akan kehilangan referensi kategori.`}
        onConfirm={handleDeleteCategory}
        isLoading={isDeletingCat}
      />
    </div>
  )
}
