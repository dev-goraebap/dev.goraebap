import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 text-muted-foreground",
);

export const tabsTriggerVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-xs",
);
