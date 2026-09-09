import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-13 w-full items-center justify-center rounded-xl bg-slate-100/90 dark:bg-muted/50 p-1 text-muted-foreground border border-slate-200/80 dark:border-border/60",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
        "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-muted/60",
        "data-active:bg-white dark:data-active:bg-card data-active:text-foreground data-active:shadow-xs data-active:font-bold",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-hidden", className)}
      {...props}
    />
  )
}

function TabsIndicator({
  className,
  ...props
}: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute rounded-lg bg-white dark:bg-card shadow-xs transition-all duration-200 ease-out",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator }
