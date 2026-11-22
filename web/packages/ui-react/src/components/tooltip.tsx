import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@goraebap/design-system/cn";
import { tooltipPopupVariants } from "@goraebap/design-system/recipes/tooltip";
import type { ComponentProps } from "react";

export const TooltipProvider = BaseTooltip.Provider;
export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export type TooltipContentProps = ComponentProps<typeof BaseTooltip.Popup> & {
  side?: ComponentProps<typeof BaseTooltip.Positioner>["side"];
  sideOffset?: number;
};

export function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup
          data-slot="tooltip-content"
          className={cn(tooltipPopupVariants(), className)}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
