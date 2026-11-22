import { cn } from "@goraebap/design-system/cn";
import { inputVariants, type InputRecipeProps } from "@goraebap/design-system/recipes/input";
import type { ComponentProps } from "react";

export type InputProps = Omit<ComponentProps<"input">, "size"> & InputRecipeProps;

export function Input({ className, size, invalid, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      aria-invalid={invalid || undefined}
      className={cn(inputVariants({ size, invalid, className }))}
      {...props}
    />
  );
}

export { inputVariants };
