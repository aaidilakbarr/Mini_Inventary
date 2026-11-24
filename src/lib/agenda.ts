import type { ReminderItem } from "@/types/database"

export interface AgendaUrgencyInfo {
  state: "completed" | "dismissed" | "overdue" | "today" | "soon" | "upcoming"
  diffDays: number
  label: string
  badgeVariant: "success" | "secondary" | "destructive" | "warning" | "info" | "outline"
}

export function getAgendaUrgency(item: ReminderItem): AgendaUrgencyInfo {
  if (item.status === "Completed") {
    return { state: "completed", diffDays: 0, label: "Selesai", badgeVariant: "success" }
  }
  if (item.status === "Dismissed") {
    return { state: "dismissed", diffDays: 0, label: "Diabaikan", badgeVariant: "secondary" }
  }

  // Compare calendar dates against local start-of-day so due-today items are not flagged overdue mid-day.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(item.due_date)
  due.setHours(0, 0, 0, 0)
  const diffDays = isNaN(due.getTime())
    ? 0
    : Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (item.status === "Overdue" || diffDays < 0) {
    const lateDays = Math.abs(diffDays)
    return {
      state: "overdue",
      diffDays,
      label: lateDays > 0 ? `Terlambat ${lateDays} hari` : "Terlambat",
      badgeVariant: "destructive",
    }
  }
  if (diffDays === 0 || item.status === "Due Today") {
    return { state: "today", diffDays: 0, label: "Hari ini", badgeVariant: "warning" }
  }
  if (diffDays === 1) {
    return { state: "soon", diffDays: 1, label: "Besok", badgeVariant: "warning" }
  }
  if (diffDays <= 3) {
    return { state: "soon", diffDays, label: `H-${diffDays}`, badgeVariant: "info" }
  }
  return { state: "upcoming", diffDays, label: `H-${diffDays}`, badgeVariant: "outline" }
}
