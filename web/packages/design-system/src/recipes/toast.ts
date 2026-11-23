import { tv, type VariantProps } from "tailwind-variants";

export const toastViewportVariants = tv({
  base: "fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none",
});

export const toastRootVariants = tv({
  base: "relative flex w-full items-start justify-between gap-3 rounded-xl border p-4 shadow-lg transition-[opacity,transform] duration-200 ease-out data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0",
  variants: {
    variant: {
      default: "border-border bg-popover text-popover-foreground",
      success: "border-success/30 bg-popover text-popover-foreground",
      destructive: "border-destructive/30 bg-popover text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const toastCloseVariants = tv({
  base: "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
});

export type ToastRootRecipeProps = VariantProps<typeof toastRootVariants>;
