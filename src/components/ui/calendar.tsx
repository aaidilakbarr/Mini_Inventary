import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  value?: string | Date | null // format 'YYYY-MM-DD' or Date
  onChange?: (date: string) => void // returns 'YYYY-MM-DD'
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

  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return selectedDate || new Date()
  })

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [value])

  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  const prevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1))
  }

  // Days calculations
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday

  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  // Generate calendar days
  const calendarDays: Array<{
    date: Date
    iso: string
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }> = []

  // Leading days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
    const iso = formatDateToISO(d)
    const isDisabled =
      (minDateParsed && d < new Date(minDateParsed.setHours(0, 0, 0, 0))) ||
      (maxDateParsed && d > new Date(maxDateParsed.setHours(23, 59, 59, 999)))
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: !!isDisabled,
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewYear, viewMonth, i)
    const iso = formatDateToISO(d)
    const isDisabled =
      (minDateParsed && d < new Date(minDateParsed.setHours(0, 0, 0, 0))) ||
      (maxDateParsed && d > new Date(maxDateParsed.setHours(23, 59, 59, 999)))
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: true,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: !!isDisabled,
    })
  }

  // Trailing days for next month to complete 35 or 42 grid
  const remaining = (7 - (calendarDays.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i)
    const iso = formatDateToISO(d)
    const isDisabled =
      (minDateParsed && d < new Date(minDateParsed.setHours(0, 0, 0, 0))) ||
      (maxDateParsed && d > new Date(maxDateParsed.setHours(23, 59, 59, 999)))
    calendarDays.push({
      date: d,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
      isDisabled: !!isDisabled,
    })
  }

  const handleSelect = (iso: string, isDisabled: boolean) => {
    if (isDisabled) return
    onChange?.(iso)
  }

  return (
    <div className={cn("p-2.5 w-full select-none", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-1 mb-2 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="font-semibold text-xs text-foreground tracking-tight">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Bulan Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-[10px] font-medium py-1 text-muted-foreground/80",
              idx === 0 && "text-red-500/80 dark:text-red-400/80"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, idx) => {
          return (
            <button
              key={`${item.iso}-${idx}`}
              type="button"
              disabled={item.isDisabled}
              onClick={() => handleSelect(item.iso, item.isDisabled)}
              className={cn(
                "h-7 w-full flex items-center justify-center rounded-md text-xs font-medium transition-all relative",
                !item.isCurrentMonth && "text-muted-foreground/40",
                item.isCurrentMonth && !item.isSelected && "text-foreground hover:bg-accent hover:text-accent-foreground",
                item.isToday && !item.isSelected && "font-bold text-primary ring-1 ring-primary/40 bg-primary/5",
                item.isSelected && "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90",
                item.isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
              )}
            >
              <span>{item.date.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
