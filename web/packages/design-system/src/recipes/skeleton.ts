import { tv, type VariantProps } from "tailwind-variants";

export const skeletonVariants = tv({
  base: "animate-pulse bg-muted",
  variants: {
    shape: {
      line: "h-4 rounded-md",
      block: "rounded-lg",
      circle: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "block",
  },
});

export type SkeletonRecipeProps = VariantProps<typeof skeletonVariants>;
