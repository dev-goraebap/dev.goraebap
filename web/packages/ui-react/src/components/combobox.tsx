import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cn } from "@goraebap/design-system/cn";
import {
  comboboxInputVariants,
  comboboxItemVariants,
  comboboxPopupVariants,
} from "@goraebap/design-system/recipes/combobox";
import { SystemIcon } from "../icons";
import { usePortalContainer } from "../lib/portal-container";
import type { ComponentProps } from "react";

export const Combobox = BaseCombobox.Root;
export const ComboboxEmpty = BaseCombobox.Empty;
export const ComboboxList = BaseCombobox.List;

export function ComboboxInput({ className, ...props }: ComponentProps<typeof BaseCombobox.Input>) {
  return (
    <div className="relative">
      <BaseCombobox.Input
        data-slot="combobox-input"
        className={cn(comboboxInputVariants(), className)}
        {...props}
      />
      <BaseCombobox.Trigger
        aria-label="목록 열기"
        className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
      >
        <SystemIcon name="chevronDown" className="size-3.5" />
      </BaseCombobox.Trigger>
    </div>
  );
}

export function ComboboxContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof BaseCombobox.Popup> & { sideOffset?: number }) {
  return (
    <BaseCombobox.Portal container={usePortalContainer()}>
      <BaseCombobox.Positioner sideOffset={sideOffset} className="z-50">
        <BaseCombobox.Popup
          data-slot="combobox-content"
          className={cn(comboboxPopupVariants(), className)}
          {...props}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export function ComboboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      data-slot="combobox-item"
      className={cn(comboboxItemVariants(), className)}
      {...props}
    >
      <span>{children}</span>
      <BaseCombobox.ItemIndicator className="text-primary shrink-0">
        <SystemIcon name="check" className="size-3.5" />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}
