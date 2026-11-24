import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  ArrowLeftRight,
  BellRing,
  Send,
  Tag,
  Users,
  Save,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog"
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories"
import { fetchProfiles, updateUserProfileRole } from "@/lib/api/profiles"
import { fetchSystemSettings, saveSystemSetting } from "@/lib/api/settings"
import { recordAuditLog } from "@/lib/api/auditLogs"
import { formatDateID } from "@/lib/formatters"
import { useAuth } from "@/hooks/useAuth"
import type { Category } from "@/types/database"
import type { UserProfile, UserRole } from "@/types/auth"

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staf",
  user: "User",
}

export function SettingsPage() {
  const { profile: currentAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("organization")

  const [orgName, setOrgName] = useState(() => localStorage.getItem("setting_org_name") || "")
  const [orgAddress, setOrgAddress] = useState(() => localStorage.getItem("setting_org_address") || "")
  const [orgEmail, setOrgEmail] = useState(() => localStorage.getItem("setting_org_email") || "")
  const [orgLogo, setOrgLogo] = useState(() => localStorage.getItem("setting_org_logo") || "")

  const [defaultLoanDays, setDefaultLoanDays] = useState(() => localStorage.getItem("setting_loan_days") || "7")
  const [maxItemsPerUser, setMaxItemsPerUser] = useState(() => localStorage.getItem("setting_max_items") || "3")
  const [gracePeriodDays, setGracePeriodDays] = useState(() => localStorage.getItem("setting_grace_period") || "1")
  const [requireApproval, setRequireApproval] = useState(() => localStorage.getItem("setting_require_approval") !== "false")

  const [warrantyLeadDays, setWarrantyLeadDays] = useState(() => localStorage.getItem("setting_warranty_lead") || "30")
  const [borrowingLeadDays, setBorrowingLeadDays] = useState(() => localStorage.getItem("setting_borrowing_lead") || "3")
  const [subscriptionLeadDays, setSubscriptionLeadDays] = useState(() => localStorage.getItem("setting_subscription_lead") || "7")

  const [inAppActive, setInAppActive] = useState(() => localStorage.getItem("setting_inapp_active") !== "false")
  const [smtpHost, setSmtpHost] = useState(() => localStorage.getItem("setting_smtp_host") || "")
  const [smtpSender, setSmtpSender] = useState(() => localStorage.getItem("setting_smtp_sender") || "")
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem("setting_tg_token") || "")
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem("setting_tg_chat_id") || "")
  const [whatsappEndpoint, setWhatsappEndpoint] = useState(() => localStorage.getItem("setting_wa_endpoint") || "")

  const [feedback, setFeedback] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingCat, setIsDeletingCat] = useState(false)

  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const showFeedback = (type: "success" | "info" | "error", message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

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
    let isMounted = true
    fetchSystemSettings()
      .then((s) => {
        if (!isMounted) return
        setOrgName(s.organization.name)
        setOrgAddress(s.organization.address)
        setOrgEmail(s.organization.email)
        setOrgLogo(s.organization.logo)

        setDefaultLoanDays(String(s.borrowing_rules.default_loan_days))
        setMaxItemsPerUser(String(s.borrowing_rules.max_items_per_user))
        setGracePeriodDays(String(s.borrowing_rules.grace_period_days))
        setRequireApproval(s.borrowing_rules.require_approval)

        setWarrantyLeadDays(String(s.reminder_thresholds.warranty_lead_days))
        setBorrowingLeadDays(String(s.reminder_thresholds.borrowing_lead_days))
        setSubscriptionLeadDays(String(s.reminder_thresholds.subscription_lead_days))

        setInAppActive(s.notifications.in_app_active)
        setSmtpHost(s.notifications.smtp_host)
        setSmtpSender(s.notifications.smtp_sender)
        setTelegramToken(s.notifications.telegram_token)
        setTelegramChatId(s.notifications.telegram_chat_id)
        setWhatsappEndpoint(s.notifications.whatsapp_endpoint)
      })
      .catch((err) => {
        console.warn("Gagal memuat pengaturan sistem dari Supabase:", err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (activeTab === "categories") loadCategories()
    else if (activeTab === "users") loadUsers()
  }, [activeTab, loadCategories, loadUsers])

  const handleSaveOrganization = async () => {
    await saveSystemSetting("organization", {
      name: orgName,
      address: orgAddress,
      email: orgEmail,
      logo: orgLogo,
    })
    showFeedback("success", "Profil organisasi disimpan.")
  }

  const handleSaveBorrowingRules = async () => {
    await saveSystemSetting("borrowing_rules", {
      default_loan_days: Number(defaultLoanDays) || 7,
      max_items_per_user: Number(maxItemsPerUser) || 3,
      grace_period_days: Number(gracePeriodDays) || 1,
      require_approval: Boolean(requireApproval),
    })
    showFeedback("success", "Aturan peminjaman disimpan.")
  }

  const handleSaveReminderRules = async () => {
    await saveSystemSetting("reminder_thresholds", {
      warranty_lead_days: Number(warrantyLeadDays) || 30,
      borrowing_lead_days: Number(borrowingLeadDays) || 3,
      subscription_lead_days: Number(subscriptionLeadDays) || 7,
    })
    showFeedback("success", "Ambang batas pengingat disimpan.")
  }

  const handleSaveNotifications = async () => {
    await saveSystemSetting("notifications", {
      in_app_active: Boolean(inAppActive),
      smtp_host: smtpHost,
      smtp_sender: smtpSender,
      telegram_token: telegramToken,
      telegram_chat_id: telegramChatId,
      whatsapp_endpoint: whatsappEndpoint,
    })
    showFeedback("success", "Saluran notifikasi disimpan.")
  }

  const handleCategorySubmit = async (
    name: string,
    type: "inventory" | "subscription" | "general",
    description?: string
  ) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, name, type, description)
      recordAuditLog({
        action: "UPDATE",
        entity_type: "category",
        entity_id: editingCategory.id,
        details: { name, type, description },
      })
    } else {
      const created = await createCategory(name, type, description)
      recordAuditLog({
        action: "CREATE",
        entity_type: "category",
        entity_id: created?.id,
        details: { name, type, description },
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
        details: { name: deletingCategory.name, type: deletingCategory.type },
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

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.id === currentAdmin?.id && newRole !== "admin") {
      showFeedback("error", "Tidak dapat menurunkan peran akun admin yang sedang aktif.")
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
          new_role: newRole,
        },
      })
      await loadUsers()
      showFeedback("success", `Peran ${targetUser.full_name || targetUser.email} diperbarui.`)
    } catch (err: any) {
      showFeedback("error", err?.message || "Gagal memperbarui peran pengguna.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const tabs = [
    { id: "organization", label: "Organisasi", icon: Building2 },
    { id: "borrowing", label: "Peminjaman", icon: ArrowLeftRight },
    { id: "reminders", label: "Pengingat", icon: BellRing },
    { id: "notifications", label: "Notifikasi", icon: Send },
    { id: "categories", label: "Kategori", icon: Tag },
    { id: "users", label: "Pengguna", icon: Users },
  ] as const

  return (
    <div className="space-y-4 sm:space-y-5 animate-enter">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-[28px] font-bold tracking-tight text-foreground">
          Pengaturan
        </h1>
      </div>

      {feedback && (
        <Alert
          variant={
            feedback.type === "success"
              ? "success"
              : feedback.type === "error"
              ? "destructive"
              : "info"
          }
          className="items-center"
        >
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <Check className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val || "organization")} className="space-y-4">
        <TabsList className="w-full sm:w-fit overflow-x-auto justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab 1: Organization */}
        <TabsContent value="organization">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Profil Organisasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-name" className="text-xs">Nama Organisasi</Label>
                  <Input
                    id="org-name"
                    placeholder="Nama perusahaan atau instansi"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-email" className="text-xs">Email Administrator</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="admin@perusahaan.com"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="org-address" className="text-xs">Alamat Kantor</Label>
                  <Input
                    id="org-address"
                    placeholder="Alamat lengkap kantor"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="org-logo" className="text-xs">URL Logo (Opsional)</Label>
                  <Input
                    id="org-logo"
                    placeholder="https://domain.com/logo.png"
                    value={orgLogo}
                    onChange={(e) => setOrgLogo(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button size="sm" onClick={handleSaveOrganization}>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Borrowing Rules */}
        <TabsContent value="borrowing">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Aturan Peminjaman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loan-days" className="text-xs">Masa Pinjam Default (Hari)</Label>
                  <Input
                    id="loan-days"
                    type="number"
                    min="1"
                    max="90"
                    value={defaultLoanDays}
                    onChange={(e) => setDefaultLoanDays(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max-items" className="text-xs">Maksimal Unit / Pengguna</Label>
                  <Input
                    id="max-items"
                    type="number"
                    min="1"
                    max="10"
                    value={maxItemsPerUser}
                    onChange={(e) => setMaxItemsPerUser(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grace-days" className="text-xs">Toleransi Keterlambatan (Hari)</Label>
                  <Input
                    id="grace-days"
                    type="number"
                    min="0"
                    max="7"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                <Label htmlFor="require-approval" className="text-xs font-medium cursor-pointer">
                  Wajib persetujuan admin sebelum peminjaman aktif
                </Label>
                <Switch
                  id="require-approval"
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button size="sm" onClick={handleSaveBorrowingRules}>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Reminders */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Ambang Batas Pengingat (H-Hari)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="warranty-lead" className="text-xs">Garansi Aset (Hari)</Label>
                  <Input
                    id="warranty-lead"
                    type="number"
                    min="1"
                    max="90"
                    value={warrantyLeadDays}
                    onChange={(e) => setWarrantyLeadDays(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="borrow-lead" className="text-xs">Tenggat Peminjaman (Hari)</Label>
                  <Input
                    id="borrow-lead"
                    type="number"
                    min="1"
                    max="14"
                    value={borrowingLeadDays}
                    onChange={(e) => setBorrowingLeadDays(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sub-lead" className="text-xs">Perpanjangan Langganan (Hari)</Label>
                  <Input
                    id="sub-lead"
                    type="number"
                    min="1"
                    max="30"
                    value={subscriptionLeadDays}
                    onChange={(e) => setSubscriptionLeadDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button size="sm" onClick={handleSaveReminderRules}>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Saluran Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-4">
                <Label htmlFor="inapp-switch" className="text-xs font-medium cursor-pointer">
                  Notifikasi In-App
                </Label>
                <Switch
                  id="inapp-switch"
                  checked={inAppActive}
                  onCheckedChange={setInAppActive}
                />
              </div>

              <div className="p-3.5 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>Email (SMTP)</span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => showFeedback("info", "Uji kirim Email diantrikan.")}
                  >
                    Uji Kirim
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp-host" className="text-xs">Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.domain.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp-sender" className="text-xs">Pengirim</Label>
                    <Input
                      id="smtp-sender"
                      placeholder="noreply@domain.com"
                      value={smtpSender}
                      onChange={(e) => setSmtpSender(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>Telegram Bot</span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => showFeedback("info", "Uji kirim Telegram diantrikan.")}
                  >
                    Uji Kirim
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tg-token" className="text-xs">Bot Token</Label>
                    <Input
                      id="tg-token"
                      type="password"
                      placeholder="Token bot Telegram"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tg-chat" className="text-xs">Chat ID</Label>
                    <Input
                      id="tg-chat"
                      placeholder="-100..."
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Send className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Gateway</span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => showFeedback("info", "Uji kirim WhatsApp diantrikan.")}
                  >
                    Uji Kirim
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wa-url" className="text-xs">Webhook URL</Label>
                  <Input
                    id="wa-url"
                    placeholder="https://api.gateway.com/send"
                    value={whatsappEndpoint}
                    onChange={(e) => setWhatsappEndpoint(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button size="sm" onClick={handleSaveNotifications}>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle>Master Kategori</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setIsCategoryModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Kategori</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-5 text-xs font-semibold text-muted-foreground">Nama</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">Modul</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">Keterangan</TableHead>
                        <TableHead className="px-5 w-[90px] text-right text-xs font-semibold text-muted-foreground">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingCategories ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                            Belum ada kategori.
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((cat) => (
                          <TableRow key={cat.id}>
                            <TableCell className="px-5 py-3 text-xs font-semibold text-foreground">
                              {cat.name}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant={cat.type === "inventory" ? "default" : cat.type === "subscription" ? "info" : "outline"} className="uppercase font-mono text-[10px]">
                                {cat.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground">
                              {cat.description || "-"}
                            </TableCell>
                            <TableCell className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setEditingCategory(cat)
                                    setIsCategoryModalOpen(true)
                                  }}
                                  aria-label={`Edit ${cat.name}`}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setDeletingCategory(cat)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  aria-label={`Hapus ${cat.name}`}
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

                {/* Mobile Category Cards */}
                <div className="md:hidden divide-y divide-border">
                  {isLoadingCategories ? (
                    <div className="py-10 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                      Belum ada kategori.
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{cat.name}</span>
                            <Badge variant={cat.type === "inventory" ? "default" : cat.type === "subscription" ? "info" : "outline"} className="uppercase font-mono text-[10px]">
                              {cat.type}
                            </Badge>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{cat.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setEditingCategory(cat)
                              setIsCategoryModalOpen(true)
                            }}
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setDeletingCategory(cat)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            aria-label={`Hapus ${cat.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Pengguna & Peran</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-5 text-xs font-semibold text-muted-foreground">Pengguna</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">Terdaftar</TableHead>
                        <TableHead className="px-5 w-[160px] text-xs font-semibold text-muted-foreground">Peran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                            Tidak ada pengguna terdaftar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {
                          const isSelf = u.id === currentAdmin?.id
                          const isUpdating = updatingUserId === u.id

                          return (
                            <TableRow key={u.id}>
                              <TableCell className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <span className="text-xs font-semibold text-foreground">{u.full_name}</span>
                                  {isSelf && <Badge variant="default">Anda</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                              <TableCell className="py-3 text-xs text-muted-foreground">
                                {u.created_at ? formatDateID(u.created_at) : "-"}
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={u.role}
                                    onValueChange={(newRole) => {
                                      if (newRole) handleRoleChange(u, newRole as UserRole)
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <SelectTrigger size="sm" className="w-28" aria-label={`Peran ${u.full_name}`}>
                                      <SelectValue>{ROLE_LABELS[u.role]}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="staff">Staf</SelectItem>
                                      <SelectItem value="user">User</SelectItem>
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

                {/* Mobile User Cards */}
                <div className="md:hidden divide-y divide-border">
                  {isLoadingUsers ? (
                    <div className="py-10 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                      Tidak ada pengguna terdaftar.
                    </div>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === currentAdmin?.id
                      const isUpdating = updatingUserId === u.id
                      return (
                        <div key={u.id} className="p-4 space-y-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                              {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground truncate">{u.full_name}</span>
                                {isSelf && <Badge variant="default">Anda</Badge>}
                              </div>
                              <p className="text-[11px] font-mono text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] text-muted-foreground">
                              {u.created_at ? formatDateID(u.created_at) : "-"}
                            </span>
                            <div className="flex items-center gap-2">
                              <Select
                                value={u.role}
                                onValueChange={(newRole) => {
                                  if (newRole) handleRoleChange(u, newRole as UserRole)
                                }}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="h-10 w-32" aria-label={`Peran ${u.full_name}`}>
                                  <SelectValue>{ROLE_LABELS[u.role]}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="staff">Staf</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={handleCategorySubmit}
        initialData={editingCategory}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Kategori"
        description={`Hapus kategori "${deletingCategory?.name}"?`}
        onConfirm={handleDeleteCategory}
        isLoading={isDeletingCat}
      />
    </div>
  )
}
