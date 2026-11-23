import { Button as BaseButton } from "@base-ui/react/button";
import {
  buttonSpinnerVariants,
  buttonVariants,
  type ButtonRecipeProps,
} from "@goraebap/design-system/recipes/button";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export type ButtonProps = ComponentProps<typeof BaseButton> &
  ButtonRecipeProps & {
    loading?: boolean;
  };

function ButtonSpinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={buttonSpinnerVariants()}>
      <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  className,
  variant,
  size,
  shape,
  loading = false,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      className={mergeClassName(buttonVariants({ variant, size, shape }), className)}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {loading && size === "icon" ? null : children}
    </BaseButton>
  );
}

export { buttonVariants };
