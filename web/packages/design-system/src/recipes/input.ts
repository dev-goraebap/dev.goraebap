import { tv, type VariantProps } from "tailwind-variants";

export const inputVariants = tv({
  base: "flex w-full rounded-md border bg-background text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      sm: "h-8 px-2.5 text-base lg:text-xs",
      default: "h-9 px-3 text-base lg:text-sm",
      lg: "h-10 px-3.5 text-base lg:text-sm",
    },
    invalid: {
      false: "border-input focus-visible:border-ring focus-visible:ring-ring",
      true: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
    },
  },
  defaultVariants: {
    size: "default",
    invalid: false,
  },
});

export type InputRecipeProps = VariantProps<typeof inputVariants>;

export const compactInputSlots = tv({
  slots: {
    input:
      "h-12 md:h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-[1rem] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  },
});
