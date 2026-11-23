import { tv, type VariantProps } from "tailwind-variants";

export const progressTrackVariants = tv({
  base: "relative h-2 w-full overflow-hidden bg-secondary",
  variants: {
    shape: {
      default: "rounded-sm",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export const progressIndicatorVariants = tv({
  base: "h-full bg-primary transition-[width] duration-300 ease-out",
  variants: {
    shape: {
      default: "rounded-sm",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export type ProgressRecipeProps = VariantProps<typeof progressTrackVariants>;
