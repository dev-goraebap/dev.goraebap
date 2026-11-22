import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn } from "@goraebap/design-system/cn";
import {
  menuItemVariants,
  menuLabelVariants,
  menuPopupVariants,
  menuSeparatorVariants,
  type MenuItemRecipeProps,
} from "@goraebap/design-system/recipes/menu";
import type { ComponentProps } from "react";

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuGroup = BaseMenu.Group;

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> & {
  side?: ComponentProps<typeof BaseMenu.Positioner>["side"];
  align?: ComponentProps<typeof BaseMenu.Positioner>["align"];
  sideOffset?: number;
};

export function MenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  children,
  ...props
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <BaseMenu.Popup
          data-slot="menu-content"
          className={cn(menuPopupVariants(), className)}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export type MenuItemProps = ComponentProps<typeof BaseMenu.Item> & MenuItemRecipeProps;

export function MenuItem({ className, variant, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-item"
      className={cn(menuItemVariants({ variant, className }))}
      {...props}
    />
  );
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof BaseMenu.GroupLabel>) {
  return (
    <BaseMenu.GroupLabel
      data-slot="menu-label"
      className={cn(menuLabelVariants(), className)}
      {...props}
    />
  );
}

export function MenuSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Separator>) {
  return (
    <BaseMenu.Separator
      data-slot="menu-separator"
      className={cn(menuSeparatorVariants(), className)}
      {...props}
    />
  );
}
