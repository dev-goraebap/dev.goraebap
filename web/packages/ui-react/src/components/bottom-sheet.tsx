import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { cn } from "@goraebap/design-system/cn";
import {
  bottomSheetBackdropVariants,
  bottomSheetContentVariants,
  bottomSheetHandleVariants,
  bottomSheetPopupVariants,
  bottomSheetViewportVariants,
} from "@goraebap/design-system/recipes/bottom-sheet";
import { dialogCloseButtonVariants } from "@goraebap/design-system/recipes/dialog";
import { SystemIcon } from "../icons";
import { usePortalContainer } from "../lib/portal-container";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export const BottomSheet = BaseDrawer.Root;
export const BottomSheetTrigger = BaseDrawer.Trigger;
export const BottomSheetClose = BaseDrawer.Close;

export type BottomSheetContentProps = ComponentProps<typeof BaseDrawer.Popup> & {
  showCloseButton?: boolean;
};

export function BottomSheetContent({
  className,
  showCloseButton = true,
  children,
  ...props
}: BottomSheetContentProps) {
  return (
    <BaseDrawer.Portal container={usePortalContainer()}>
      <BaseDrawer.Backdrop className={bottomSheetBackdropVariants()} />
      <BaseDrawer.Viewport className={bottomSheetViewportVariants()}>
        <BaseDrawer.Popup
          data-slot="bottom-sheet-content"
          className={mergeClassName(bottomSheetPopupVariants(), className)}
          {...props}
        >
          <div aria-hidden="true" className={bottomSheetHandleVariants()} />
          <BaseDrawer.Content className={bottomSheetContentVariants()}>
            {children}
          </BaseDrawer.Content>
          {showCloseButton && (
            <BaseDrawer.Close aria-label="닫기" className={dialogCloseButtonVariants()}>
              <SystemIcon name="close" className="size-4" />
            </BaseDrawer.Close>
          )}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

export function BottomSheetTitle({ className, ...props }: ComponentProps<typeof BaseDrawer.Title>) {
  return (
    <BaseDrawer.Title
      data-slot="bottom-sheet-title"
      className={cn("pr-7 text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function BottomSheetDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDrawer.Description>) {
  return (
    <BaseDrawer.Description
      data-slot="bottom-sheet-description"
      className={cn("text-muted-foreground mt-1.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function BottomSheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn("mt-5 flex flex-col-reverse gap-2", className)}
      {...props}
    />
  );
}
