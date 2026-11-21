import { cva, type VariantProps } from "class-variance-authority";

export const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorRecipeProps = VariantProps<typeof separatorVariants>;
