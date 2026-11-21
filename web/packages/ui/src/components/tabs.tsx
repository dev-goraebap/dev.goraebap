import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@goraebap/design-system/cn";
import { tabsListVariants, tabsTriggerVariants } from "@goraebap/design-system/recipes/tabs";
import type { ComponentProps } from "react";

export const Tabs = BaseTabs.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List data-slot="tabs-list" className={cn(tabsListVariants(), className)} {...props} />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants(), className)}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel
      data-slot="tabs-content"
      className={cn("mt-3 outline-none", className)}
      {...props}
    />
  );
}
