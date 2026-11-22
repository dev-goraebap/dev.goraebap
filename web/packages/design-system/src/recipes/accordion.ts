import { cva } from "class-variance-authority";

export const accordionItemVariants = cva("border-b border-border last:border-b-0");

export const accordionTriggerVariants = cva(
  "flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&[data-panel-open]>svg]:rotate-180 [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg]:transition-transform [&_svg]:duration-200",
);

export const accordionPanelVariants = cva(
  "overflow-hidden pb-3.5 text-xs leading-relaxed text-muted-foreground",
);
