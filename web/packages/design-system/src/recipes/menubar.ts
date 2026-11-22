import { cva } from "class-variance-authority";

export const menubarVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1",
);

export const menubarTriggerVariants = cva(
  "inline-flex cursor-pointer items-center rounded-md px-2.5 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:bg-accent",
);
