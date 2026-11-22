import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-3.5 text-sm",
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
  },
);

export type InputRecipeProps = VariantProps<typeof inputVariants>;
