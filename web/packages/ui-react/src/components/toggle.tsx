import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cn } from "@goraebap/design-system/cn";
import { toggleVariants, type ToggleRecipeProps } from "@goraebap/design-system/recipes/toggle";
import type { ComponentProps } from "react";

export type ToggleProps = ComponentProps<typeof BaseToggle> & ToggleRecipeProps;

export function Toggle({ className, variant, size, shape, ...props }: ToggleProps) {
  return (
    <BaseToggle
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { toggleVariants };
