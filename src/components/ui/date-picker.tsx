import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { formatDateID } from "@/lib/formatters"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
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
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-xs transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal",
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
            className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Hapus tanggal"
          >
            <X className="size-3" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 z-50 rounded-xl" align="start">
        {showPresets && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border/60 bg-muted/20">
            <button
              type="button"
              onClick={() => setRelativeDays(0)}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setRelativeDays(3)}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              +3 Hari
            </button>
            <button
              type="button"
              onClick={() => setRelativeDays(7)}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              +7 Hari
            </button>
            <button
              type="button"
              onClick={() => setRelativeMonths(1)}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              +1 Bulan
            </button>
            <button
              type="button"
              onClick={() => setRelativeMonths(12)}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              +1 Tahun
            </button>
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
