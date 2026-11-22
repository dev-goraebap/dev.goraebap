import { cva, type VariantProps } from "class-variance-authority";

export const toggleGroupVariants = cva(
  "inline-flex items-center gap-0.5 border border-border bg-background p-0.5",
  {
    variants: {
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      shape: "default",
    },
  },
);

export type ToggleGroupRecipeProps = VariantProps<typeof toggleGroupVariants>;
