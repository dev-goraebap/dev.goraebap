"use client";

import { compactTooltipSlots } from "@goraebap/design-system/recipes/tooltip";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { mergeClassName } from "../lib/utils";
import { usePortalContainer } from "../lib/portal-container";
import * as React from "react";

const styles = compactTooltipSlots();

/*
 * Base UI 툴팁은 보이기만 하고 읽는 이름 · 설명을 잇지 않는다. 그래서 열린 동안 내용에 role="tooltip"과 id를 두고,
 * 트리거에 aria-describedby로 잇는다(WAI-ARIA Tooltip 패턴). 초점을 받으면 열리므로 키보드 · 화면 낭독기도 설명을 읽는다.
 * 내용을 숨겨 둔 툴팁(펼친 사이드바의 hidden)은 잇지 않는다.
 */
type TooltipLink = {
  id: string;
  isOpen: boolean;
  setHidden: (isHidden: boolean) => void;
};
const TooltipLinkContext = React.createContext<TooltipLink | null>(null);

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: TooltipPrimitive.Root.Props) {
  const id = React.useId();
  const [isOpenInside, setOpenInside] = React.useState(defaultOpen);
  const [isHidden, setHidden] = React.useState(false);
  const isOpen = (open ?? isOpenInside) && !isHidden;
  const link = React.useMemo(() => ({ id, isOpen, setHidden }), [id, isOpen]);
  return (
    <TooltipLinkContext.Provider value={link}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          setOpenInside(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      />
    </TooltipLinkContext.Provider>
  );
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  const link = React.useContext(TooltipLinkContext);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={link?.isOpen ? link.id : undefined}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  id,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const link = React.useContext(TooltipLinkContext);
  const setHidden = link?.setHidden;
  const isHidden = Boolean(props.hidden);
  React.useLayoutEffect(() => setHidden?.(isHidden), [setHidden, isHidden]);
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={styles.tooltipContentPositioner()}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          role="tooltip"
          id={id ?? link?.id}
          className={mergeClassName(styles.tooltipContent(), className)}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className={styles.tooltipContentArrow()} />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
