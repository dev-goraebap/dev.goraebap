import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { cn } from "@goraebap/design-system/cn";
import {
  navigationMenuLinkVariants,
  navigationMenuListVariants,
  navigationMenuPopupVariants,
  navigationMenuTriggerVariants,
} from "@goraebap/design-system/recipes/navigation-menu";
import { SystemIcon } from "../icons";
import type { ComponentProps } from "react";

export const NavigationMenu = BaseNavigationMenu.Root;
export const NavigationMenuItem = BaseNavigationMenu.Item;
export const NavigationMenuContent = BaseNavigationMenu.Content;

export function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.List>) {
  return (
    <BaseNavigationMenu.List
      data-slot="navigation-menu-list"
      className={cn(navigationMenuListVariants(), className)}
      {...props}
    />
  );
}

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.Trigger>) {
  return (
    <BaseNavigationMenu.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerVariants(), className)}
      {...props}
    >
      <span>{children}</span>
      <BaseNavigationMenu.Icon className="transition-transform duration-150 data-[popup-open]:rotate-180">
        <SystemIcon name="chevronDown" className="size-3" />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

export function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.Link>) {
  return (
    <BaseNavigationMenu.Link
      data-slot="navigation-menu-link"
      className={cn(navigationMenuLinkVariants(), className)}
      {...props}
    />
  );
}

export function NavigationMenuViewport({
  className,
  sideOffset = 8,
}: {
  className?: string;
  sideOffset?: number;
}) {
  return (
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner sideOffset={sideOffset} className="z-50">
        <BaseNavigationMenu.Popup
          data-slot="navigation-menu-popup"
          className={cn(navigationMenuPopupVariants(), className)}
        >
          <BaseNavigationMenu.Viewport />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  );
}
