import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { cn } from "@goraebap/design-system/cn";
import {
  dialogCloseButtonVariants,
  dialogSheetHandleVariants,
} from "@goraebap/design-system/recipes/dialog";
import {
  drawerBackdropVariants,
  drawerPopupVariants,
  type DrawerPopupRecipeProps,
} from "@goraebap/design-system/recipes/drawer";
import { SystemIcon } from "../icons";
import type { ComponentProps } from "react";

export const Drawer = BaseDrawer.Root;
export const DrawerTrigger = BaseDrawer.Trigger;
export const DrawerClose = BaseDrawer.Close;

export type DrawerContentProps = ComponentProps<typeof BaseDrawer.Popup> &
  DrawerPopupRecipeProps & {
    showCloseButton?: boolean;
  };

export function DrawerContent({
  className,
  side = "right",
  showCloseButton = true,
  children,
  ...props
}: DrawerContentProps) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className={drawerBackdropVariants()} />
      <BaseDrawer.Popup
        data-slot="drawer-content"
        className={cn(drawerPopupVariants({ side, className }))}
        {...props}
      >
        {side === "bottom" && <div aria-hidden="true" className={dialogSheetHandleVariants()} />}
        {children}
        {showCloseButton && (
          <BaseDrawer.Close aria-label="닫기" className={dialogCloseButtonVariants()}>
            <SystemIcon name="close" className="size-4" />
          </BaseDrawer.Close>
        )}
      </BaseDrawer.Popup>
    </BaseDrawer.Portal>
  );
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof BaseDrawer.Title>) {
  return (
    <BaseDrawer.Title
      data-slot="drawer-title"
      className={cn("pr-7 text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDrawer.Description>) {
  return (
    <BaseDrawer.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground mt-1.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}
