import { tv, type VariantProps } from "tailwind-variants";

export const separatorVariants = tv({
  base: "shrink-0 bg-border",
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
    stretch: { true: "" },
  },
  compoundVariants: [
    { orientation: "vertical", stretch: true, class: "h-auto self-stretch" },
  ],
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorRecipeProps = VariantProps<typeof separatorVariants>;
