import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { cn } from "@goraebap/design-system/cn";
import { menubarTriggerVariants, menubarVariants } from "@goraebap/design-system/recipes/menubar";
import type { ComponentProps } from "react";

export function Menubar({ className, ...props }: ComponentProps<typeof BaseMenubar>) {
  return (
    <BaseMenubar data-slot="menubar" className={cn(menubarVariants(), className)} {...props} />
  );
}

export { menubarTriggerVariants, menubarVariants };
