import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cn } from "@goraebap/design-system/cn";
import {
  collapsiblePanelVariants,
  collapsibleTriggerVariants,
} from "@goraebap/design-system/recipes/collapsible";
import { SystemIcon } from "../icons";
import type { ComponentProps } from "react";

export const Collapsible = BaseCollapsible.Root;

export function CollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCollapsible.Trigger>) {
  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={cn(collapsibleTriggerVariants(), className)}
      {...props}
    >
      <span>{children}</span>
      <SystemIcon name="chevronDown" className="size-3.5" />
    </BaseCollapsible.Trigger>
  );
}

export function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof BaseCollapsible.Panel>) {
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-content"
      className={cn(collapsiblePanelVariants(), className)}
      {...props}
    />
  );
}
