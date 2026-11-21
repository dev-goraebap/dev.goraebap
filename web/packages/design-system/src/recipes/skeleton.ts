import { cva, type VariantProps } from "class-variance-authority";

export const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      line: "h-4 w-full rounded-md",
      block: "rounded-lg",
      circle: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "block",
  },
});

export type SkeletonRecipeProps = VariantProps<typeof skeletonVariants>;
