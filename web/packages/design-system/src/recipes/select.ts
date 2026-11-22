import { cva, type VariantProps } from "class-variance-authority";

export const selectTriggerVariants = cva(
  "inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-3.5 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const selectPopupVariants = cva(
  "z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
);

export const selectItemVariants = cva(
  "relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-popover-foreground outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
);

export type SelectTriggerRecipeProps = VariantProps<typeof selectTriggerVariants>;
