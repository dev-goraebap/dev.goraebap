import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@goraebap/design-system/cn";
import {
  dialogBackdropVariants,
  dialogPopupVariants,
  type DialogPopupRecipeProps,
} from "@goraebap/design-system/recipes/dialog";
import type { ComponentProps } from "react";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> & DialogPopupRecipeProps;

export function DialogContent({ className, surface, children, ...props }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={dialogBackdropVariants()} />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(dialogPopupVariants({ surface, className }))}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("text-base font-semibold tracking-tight", className)}
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
