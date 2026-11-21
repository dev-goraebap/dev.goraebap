import { cn } from "@goraebap/design-system/cn";
import { alertVariants, type AlertRecipeProps } from "@goraebap/design-system/recipes/alert";
import type { ComponentProps } from "react";

export type AlertProps = ComponentProps<"div"> & AlertRecipeProps;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"h5">) {
  return <h5 data-slot="alert-title" className={cn(className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="alert-description" className={cn(className)} {...props} />;
}
