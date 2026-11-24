import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-bold tracking-[0.01em] whitespace-nowrap transition-transform duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        solid: "bg-primary text-primary-foreground",
        secondary: "bg-foreground/85 text-background",
        success: "bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white",
        info: "bg-blue-600 text-white dark:bg-blue-500 dark:text-white",
        warning: "bg-amber-700 text-white dark:bg-amber-600 dark:text-white",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-secondary text-foreground border-border",
        ghost: "bg-muted text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
