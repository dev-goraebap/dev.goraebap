import { tv, type VariantProps } from "tailwind-variants";

export const textareaVariants = tv({
  base: "flex min-h-24 w-full rounded-md border bg-background px-3 py-2 text-base lg:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    invalid: {
      false: "border-input focus-visible:border-ring focus-visible:ring-ring",
      true: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
    },
  },
  defaultVariants: {
    invalid: false,
  },
});

export type TextareaRecipeProps = VariantProps<typeof textareaVariants>;

export const compactTextareaVariants = tv({
  base: "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-[1rem] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
});
