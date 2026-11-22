import { cva, type VariantProps } from "class-variance-authority";

export const progressTrackVariants = cva("relative h-2 w-full overflow-hidden bg-secondary", {
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

export const progressIndicatorVariants = cva(
  "h-full bg-primary transition-[width] duration-300 ease-out",
  {
    variants: {
      shape: {
        default: "rounded-sm",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      shape: "default",
    },
  },
);

export type ProgressRecipeProps = VariantProps<typeof progressTrackVariants>;
