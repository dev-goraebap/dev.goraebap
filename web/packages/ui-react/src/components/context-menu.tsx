import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { cn } from "@goraebap/design-system/cn";
import {
  contextMenuItemVariants,
  contextMenuPopupVariants,
  contextMenuSeparatorVariants,
  type ContextMenuItemRecipeProps,
} from "@goraebap/design-system/recipes/context-menu";
import { usePortalContainer } from "../lib/portal-container";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export const ContextMenu = BaseContextMenu.Root;
export const ContextMenuTrigger = BaseContextMenu.Trigger;

export function ContextMenuContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseContextMenu.Popup>) {
  return (
    <BaseContextMenu.Portal container={usePortalContainer()}>
      <BaseContextMenu.Positioner className="z-50">
        <BaseContextMenu.Popup
          data-slot="context-menu-content"
          className={cn(contextMenuPopupVariants(), className)}
          {...props}
        >
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export type ContextMenuItemProps = ComponentProps<typeof BaseContextMenu.Item> &
  ContextMenuItemRecipeProps;

export function ContextMenuItem({ className, variant, ...props }: ContextMenuItemProps) {
  return (
    <BaseContextMenu.Item
      data-slot="context-menu-item"
      className={mergeClassName(contextMenuItemVariants({ variant }), className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseContextMenu.Separator>) {
  return (
    <BaseContextMenu.Separator
      data-slot="context-menu-separator"
      className={cn(contextMenuSeparatorVariants(), className)}
      {...props}
    />
  );
}
