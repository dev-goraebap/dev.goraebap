import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cn } from "@goraebap/design-system/cn";
import { checkboxVariants } from "@goraebap/design-system/recipes/checkbox";
import type { ComponentProps } from "react";

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={cn(checkboxVariants(), className)}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex items-center justify-center text-current">
        <svg viewBox="0 0 12 12" fill="none" className="size-3" aria-hidden="true">
          <path
            d="M2.5 6.2 4.9 8.6 9.5 3.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
