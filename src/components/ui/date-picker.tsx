import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDateID } from "@/lib/formatters"

export interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: string | Date
  maxDate?: string | Date
  showPresets?: boolean
  clearable?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  disabled = false,
  className,
  minDate,
  maxDate,
  showPresets = true,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedISO: string) => {
    onChange?.(selectedISO)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
  }

  const setRelativeDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    handleSelect(`${year}-${month}-${day}`)
  }

  const setRelativeMonths = (months: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() + months)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    handleSelect(`${year}-${month}-${day}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-card px-2.5 text-xs transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value ? formatDateID(value) : placeholder}
          </span>
        </div>

        {value && clearable && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onChange?.("")
              }
            }}
            className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Hapus tanggal"
            aria-label="Hapus tanggal"
          >
            <X className="size-3" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 z-50 rounded-xl" align="start">
        {showPresets && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/40">
            <Button type="button" variant="secondary" size="xs" onClick={() => setRelativeDays(0)}>
              Hari Ini
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setRelativeDays(3)}>
              +3 Hari
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setRelativeDays(7)}>
              +7 Hari
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setRelativeMonths(1)}>
              +1 Bulan
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setRelativeMonths(12)}>
              +1 Tahun
            </Button>
          </div>
        )}
        <Calendar
          value={value}
          onChange={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  )
}
