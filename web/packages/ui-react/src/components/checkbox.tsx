import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cn } from "@goraebap/design-system/cn";
import { checkboxVariants } from "@goraebap/design-system/recipes/checkbox";
import { SystemIcon } from "../icons";
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
        <SystemIcon name="check" className="size-3" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
