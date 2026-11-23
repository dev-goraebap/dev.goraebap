import { tv, type VariantProps } from "tailwind-variants";

export const cardVariants = tv({
  base: "rounded-xl border border-border bg-card text-card-foreground",
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      default: "p-6",
    },
    interactive: {
      false: "",
      true: "transition-colors hover:bg-accent/40",
    },
  },
  defaultVariants: {
    padding: "default",
    interactive: false,
  },
});

export type CardRecipeProps = VariantProps<typeof cardVariants>;
