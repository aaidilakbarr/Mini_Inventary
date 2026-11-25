import {
  CircleDashed,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react"
import type { PlannerTaskPriority, PlannerTaskStatus } from "@/types/database"

export type PlannerViewMode = "kanban" | "timeline" | "spreadsheet" | "calendar"
export type PlannerSortKey = "position" | "due_date" | "priority" | "created_at" | "title"

export const PLANNER_STATUSES: PlannerTaskStatus[] = [
  "Not Started",
  "Pending",
  "Under Review",
  "Completed",
]

export const PLANNER_PRIORITIES: PlannerTaskPriority[] = [
  "Urgent",
  "Medium",
  "Low",
]

export const PRIORITY_WEIGHT: Record<PlannerTaskPriority, number> = {
  Urgent: 3,
  Medium: 2,
  Low: 1,
}

export const STATUS_META: Record<
  PlannerTaskStatus,
  {
    label: string
    icon: typeof CircleDashed
    pillClass: string
    badgeClass: string
    barClass: string
    dotClass: string
  }
> = {
  "Not Started": {
    label: "Belum Dimulai",
    icon: CircleDashed,
    pillClass: "bg-slate-100 text-slate-700 border-slate-200",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    barClass: "bg-slate-500",
    dotClass: "bg-slate-400",
  },
  Pending: {
    label: "Pending",
    icon: Clock,
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    barClass: "bg-rose-500",
    dotClass: "bg-rose-500",
  },
  "Under Review": {
    label: "Dalam Tinjauan",
    icon: Eye,
    pillClass: "bg-violet-50 text-violet-700 border-violet-200",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    barClass: "bg-violet-600",
    dotClass: "bg-violet-500",
  },
  Completed: {
    label: "Selesai",
    icon: CheckCircle2,
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    barClass: "bg-emerald-600",
    dotClass: "bg-emerald-500",
  },
}

export const PRIORITY_META: Record<
  PlannerTaskPriority,
  {
    label: string
    badgeClass: string
  }
> = {
  Urgent: {
    label: "Mendesak",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  Medium: {
    label: "Sedang",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
  Low: {
    label: "Rendah",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
}

export const DEFAULT_CHANNELS = [
  "Website",
  "Instagram",
  "YouTube",
  "LinkedIn",
  "Email",
  "Internal",
]

export function getInitials(name?: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function isTaskOverdue(dueDate?: string | null, status?: PlannerTaskStatus): boolean {
  if (!dueDate || status === "Completed") return false
  const due = new Date(dueDate)
  if (isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function toDateInputValue(isoString?: string | null): string {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function fromDateInputValue(dateStr: string): string | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T09:00:00`)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}
