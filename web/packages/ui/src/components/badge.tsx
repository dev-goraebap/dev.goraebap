import { cn } from "@goraebap/design-system/cn";
import { badgeVariants, type BadgeRecipeProps } from "@goraebap/design-system/recipes/badge";
import type { ComponentProps } from "react";

export type BadgeProps = ComponentProps<"span"> & BadgeRecipeProps;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { badgeVariants };
