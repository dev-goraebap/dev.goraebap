import { Select as BaseSelect } from "@base-ui/react/select";
import { cn } from "@goraebap/design-system/cn";
import {
  selectItemVariants,
  selectPopupVariants,
  selectTriggerVariants,
  type SelectTriggerRecipeProps,
} from "@goraebap/design-system/recipes/select";
import { SystemIcon } from "../icons";
import type { ComponentProps } from "react";

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

export type SelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger> &
  SelectTriggerRecipeProps;

export function SelectTrigger({ className, size, children, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ size, className }))}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="text-muted-foreground shrink-0">
        <SystemIcon name="chevronDown" className="size-3.5" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export type SelectContentProps = ComponentProps<typeof BaseSelect.Popup> & {
  sideOffset?: number;
};

export function SelectContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={sideOffset} className="z-50">
        <BaseSelect.Popup
          data-slot="select-content"
          className={cn(selectPopupVariants(), className)}
          {...props}
        >
          <BaseSelect.List className="space-y-0.5">{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(selectItemVariants(), className)}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="text-primary shrink-0">
        <SystemIcon name="check" className="size-3.5" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
