import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
  badge?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
}

export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ditemukan.",
  disabled = false,
  className,
  clearable = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    )
  }, [options, search])

  React.useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  const handleSelect = (val: string) => {
    onChange?.(val)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-card px-2.5 text-xs transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal",
          !selectedOption && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate flex-1">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              {selectedOption.badge && (
                <Badge variant="default" className="h-4 px-1.5 text-[10px] font-mono rounded">
                  {selectedOption.badge}
                </Badge>
              )}
              <span className="truncate font-medium text-foreground">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
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
              aria-label="Hapus pilihan"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 opacity-60" />
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[var(--anchor-width,22rem)] p-0 z-50 rounded-xl" align="start">
        <div className="relative flex items-center border-b border-border px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground shrink-0 mr-1.5" />
          <Input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearch("")}
              aria-label="Bersihkan pencarian"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto p-1 text-xs">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant="ghost"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "h-auto w-full justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-normal",
                    isSelected && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium"
                  )}
                >
                  <div className="flex flex-col gap-0.5 truncate flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {opt.badge && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono rounded shrink-0">
                          {opt.badge}
                        </Badge>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {opt.sublabel && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-1" />}
                </Button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
