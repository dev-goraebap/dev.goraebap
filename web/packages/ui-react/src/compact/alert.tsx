import {
  compactAlertVariants as alertVariants,
  type compactAlertRecipeProps,
  compactAlertSlots,
} from "@goraebap/design-system/recipes/alert";
import * as React from "react";

import { mergeClassName } from "../lib/utils";

const styles = compactAlertSlots();

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & compactAlertRecipeProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={mergeClassName(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={mergeClassName(styles.alertTitle(), className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={mergeClassName(styles.alertDescription(), className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={mergeClassName(styles.alertAction(), className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
