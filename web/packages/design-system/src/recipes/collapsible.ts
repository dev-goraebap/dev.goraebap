import { cva } from "class-variance-authority";

export const collapsibleTriggerVariants = cva(
  "inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&[data-panel-open]>svg]:rotate-180 [&_svg]:transition-transform [&_svg]:duration-200",
);

export const collapsiblePanelVariants = cva(
  "overflow-hidden text-xs leading-relaxed text-muted-foreground",
);
