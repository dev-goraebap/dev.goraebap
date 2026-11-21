import { cva, type VariantProps } from "class-variance-authority";

export const textareaVariants = cva(
  "flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      invalid: {
        false: "",
        true: "border-destructive focus-visible:ring-destructive",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

export type TextareaRecipeProps = VariantProps<typeof textareaVariants>;
