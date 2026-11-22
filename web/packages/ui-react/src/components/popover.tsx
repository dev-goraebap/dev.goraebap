import { Popover as BasePopover } from "@base-ui/react/popover";
import { cn } from "@goraebap/design-system/cn";
import { popoverPopupVariants } from "@goraebap/design-system/recipes/popover";
import type { ComponentProps } from "react";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  sideOffset?: number;
};

export function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <BasePopover.Popup
          data-slot="popover-content"
          className={cn(popoverPopupVariants(), className)}
          {...props}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ className, ...props }: ComponentProps<typeof BasePopover.Title>) {
  return (
    <BasePopover.Title
      data-slot="popover-title"
      className={cn("text-sm font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Description>) {
  return (
    <BasePopover.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground mt-1 text-xs leading-relaxed", className)}
      {...props}
    />
  );
}
