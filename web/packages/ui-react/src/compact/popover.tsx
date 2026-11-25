import { compactPopoverSlots } from "@goraebap/design-system/recipes/popover";
import * as React from "react";
import { ButtonStyleReset } from "./button";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { mergeClassName } from "../lib/utils";
import { usePortalContainer } from "../lib/portal-container";

const styles = compactPopoverSlots();

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  hasBackdrop = false,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "anchor"
  > & {
    /** 뒤를 옅게 덮는다: 바깥을 누르면 닫히기만 하는 시트 모양의 팝오버(Popover의 modal과 함께 쓴다). */
    hasBackdrop?: boolean;
  }) {
  const container = usePortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <ButtonStyleReset>
        {hasBackdrop && (
          <PopoverPrimitive.Backdrop
            data-slot="popover-backdrop"
            className={styles.popoverBackdrop()}
          />
        )}
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          anchor={anchor}
          className={styles.popoverContentPositioner()}
        >
          <PopoverPrimitive.Popup
            data-slot="popover-content"
            className={mergeClassName(styles.popoverContent(), className)}
            {...props}
          />
        </PopoverPrimitive.Positioner>
      </ButtonStyleReset>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={mergeClassName(styles.popoverHeader(), className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={mergeClassName(styles.popoverTitle(), className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={mergeClassName(styles.popoverDescription(), className)}
      {...props}
    />
  );
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
