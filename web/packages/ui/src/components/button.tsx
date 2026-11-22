import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@goraebap/design-system/cn";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";
import type { ComponentProps } from "react";

export type ButtonProps = ComponentProps<typeof BaseButton> & ButtonRecipeProps;

export function Button({ className, variant, size, shape, ...props }: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
