import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  value?: string | Date | null
  onChange?: (date: string) => void
  minDate?: string | Date
  maxDate?: string | Date
  className?: string
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function parseToDate(val?: string | Date | null): Date | null {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  if (typeof val === "string") {
    const parts = val.split("T")[0].split("-")
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const d = parseInt(parts[2], 10)
      const date = new Date(y, m, d)
      return isNaN(date.getTime()) ? null : date
    }
  }
  return null
}

function formatDateToISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const selectedDate = parseToDate(value)
  const today = new Date()
  const todayISO = formatDateToISO(today)
  const selectedISO = selectedDate ? formatDateToISO(selectedDate) : null

  const minDateParsed = parseToDate(minDate)
  const maxDateParsed = parseToDate(maxDate)

  const [viewDate, setViewDate] = React.useState<Date>(() => selectedDate || new Date())

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [value])

  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDayOfWeek = firstDayOfMonth.getDay()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const checkDisabled = (d: Date) => {
    if (minDateParsed) {
      const min = new Date(minDateParsed.getFullYear(), minDateParsed.getMonth(), minDateParsed.getDate())
      if (d < min) return true
    }
    if (maxDateParsed) {
      const max = new Date(maxDateParsed.getFullYear(), maxDateParsed.getMonth(), maxDateParsed.getDate(), 23, 59, 59, 999)
      if (d > max) return true
    }
    return false
  }

  const calendarDays: Array<{
    date: Date
    iso: string
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }> = []

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
    const iso = formatDateToISO(d)
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: checkDisabled(d),
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewYear, viewMonth, i)
    const iso = formatDateToISO(d)
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: true,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: checkDisabled(d),
    })
  }

  const remaining = (7 - (calendarDays.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i)
    const iso = formatDateToISO(d)
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: checkDisabled(d),
    })
  }

  return (
    <div className={cn("p-2.5 w-full select-none", className)}>
      <div className="flex items-center justify-between gap-1 mb-2 px-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="font-semibold text-xs text-foreground">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
          aria-label="Bulan Berikutnya"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-[10px] font-medium py-1 text-muted-foreground",
              idx === 0 && "text-destructive/80"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, idx) => (
          <Button
            key={`${item.iso}-${idx}`}
            type="button"
            variant={item.isSelected ? "default" : "ghost"}
            size="icon-xs"
            disabled={item.isDisabled}
            onClick={() => !item.isDisabled && onChange?.(item.iso)}
            className={cn(
              "h-7 w-full text-xs font-medium",
              !item.isCurrentMonth && !item.isSelected && "text-muted-foreground/45",
              item.isToday && !item.isSelected && "font-bold text-primary ring-1 ring-primary/40 bg-primary/5"
            )}
          >
            {item.date.getDate()}
          </Button>
        ))}
      </div>
    </div>
  )
}
