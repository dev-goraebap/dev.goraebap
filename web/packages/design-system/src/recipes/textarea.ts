import { tv, type VariantProps } from "tailwind-variants";

export const textareaVariants = tv({
  base: "flex min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
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
