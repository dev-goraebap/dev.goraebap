import { Button as BaseButton } from "@base-ui/react/button";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export type ButtonProps = ComponentProps<typeof BaseButton> & ButtonRecipeProps;

export function Button({ className, variant, size, shape, ...props }: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={mergeClassName(buttonVariants({ variant, size, shape }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
