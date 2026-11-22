import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { cn } from "@goraebap/design-system/cn";
import {
  otpFieldInputVariants,
  otpFieldRootVariants,
  otpFieldSeparatorVariants,
} from "@goraebap/design-system/recipes/otp-field";
import type { ComponentProps } from "react";

export function OTPField({ className, ...props }: ComponentProps<typeof BaseOTPField.Root>) {
  return (
    <BaseOTPField.Root
      data-slot="otp-field"
      className={cn(otpFieldRootVariants(), className)}
      {...props}
    />
  );
}

export function OTPFieldInput({ className, ...props }: ComponentProps<typeof BaseOTPField.Input>) {
  return (
    <BaseOTPField.Input
      data-slot="otp-field-input"
      className={cn(otpFieldInputVariants(), className)}
      {...props}
    />
  );
}

export function OTPFieldSeparator({
  className,
  children = "-",
  ...props
}: ComponentProps<typeof BaseOTPField.Separator>) {
  return (
    <BaseOTPField.Separator
      data-slot="otp-field-separator"
      className={cn(otpFieldSeparatorVariants(), className)}
      {...props}
    >
      {children}
    </BaseOTPField.Separator>
  );
}
