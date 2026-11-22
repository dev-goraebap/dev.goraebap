import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { cn } from "@goraebap/design-system/cn";
import {
  accordionItemVariants,
  accordionPanelVariants,
  accordionTriggerVariants,
} from "@goraebap/design-system/recipes/accordion";
import { SystemIcon } from "../icons";
import type { ComponentProps } from "react";

export const Accordion = BaseAccordion.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants(), className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseAccordion.Trigger>) {
  return (
    <BaseAccordion.Header className="flex">
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={cn(accordionTriggerVariants(), className)}
        {...props}
      >
        <span>{children}</span>
        <SystemIcon name="chevronDown" className="size-4" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function AccordionContent({
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      data-slot="accordion-content"
      className={cn(accordionPanelVariants(), className)}
      {...props}
    />
  );
}
