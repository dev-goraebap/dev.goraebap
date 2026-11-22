import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@goraebap/design-system/cn";
import {
  dialogBackdropVariants,
  dialogCloseButtonVariants,
  dialogPopupVariants,
  dialogSheetHandleVariants,
  type DialogPopupRecipeProps,
} from "@goraebap/design-system/recipes/dialog";
import { SystemIcon } from "../icons";
import { usePortalContainer } from "../lib/portal-container";
import type { ComponentProps } from "react";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> &
  DialogPopupRecipeProps & {
    showCloseButton?: boolean;
  };

export function DialogContent({
  className,
  surface,
  showCloseButton = true,
  children,
  ...props
}: DialogContentProps) {
  return (
    <BaseDialog.Portal container={usePortalContainer()}>
      <BaseDialog.Backdrop className={dialogBackdropVariants()} />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(dialogPopupVariants({ surface, className }))}
        {...props}
      >
        {surface === "sheet" && <div aria-hidden="true" className={dialogSheetHandleVariants()} />}
        {children}
        {showCloseButton && (
          <BaseDialog.Close aria-label="닫기" className={dialogCloseButtonVariants()}>
            <SystemIcon name="close" className="size-4" />
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("space-y-1.5 pr-7", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("pr-7 text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground mt-1.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}
