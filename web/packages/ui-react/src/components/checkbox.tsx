import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { checkboxVariants, compactCheckboxSlots } from "@goraebap/design-system/recipes/checkbox";
import { SystemIcon } from "../icons";
import { mergeClassName } from "../lib/utils";
import type { ComponentProps } from "react";

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root> & {
  appearance?: "compact";
};

const compactStyles = compactCheckboxSlots();

export function Checkbox({ className, appearance, ...props }: CheckboxProps) {
  const compact = appearance === "compact";
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={mergeClassName(compact ? compactStyles.checkbox() : checkboxVariants(), className)}
      {...props}
    >
      <BaseCheckbox.Indicator
        data-slot={compact ? "checkbox-indicator" : undefined}
        className={
          compact
            ? compactStyles.checkboxIndicator()
            : "flex items-center justify-center text-current"
        }
      >
        <SystemIcon name="check" className={compact ? undefined : "size-3"} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
