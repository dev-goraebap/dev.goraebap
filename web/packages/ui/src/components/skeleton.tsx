import { cn } from "@goraebap/design-system/cn";
import {
  skeletonVariants,
  type SkeletonRecipeProps,
} from "@goraebap/design-system/recipes/skeleton";
import type { ComponentProps } from "react";

export type SkeletonProps = ComponentProps<"div"> & SkeletonRecipeProps;

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape, className }))}
      {...props}
    />
  );
}
