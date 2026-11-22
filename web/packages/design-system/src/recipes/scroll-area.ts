import { cva } from "class-variance-authority";

export const scrollAreaRootVariants = cva(
  "relative overflow-hidden rounded-xl border border-border bg-card",
);

export const scrollAreaViewportVariants = cva("h-full w-full overflow-auto");

export const scrollAreaScrollbarVariants = cva(
  "flex touch-none select-none p-0.5 transition-opacity data-[orientation=vertical]:w-2 data-[orientation=horizontal]:h-2",
);

export const scrollAreaThumbVariants = cva(
  "relative flex-1 rounded-sm bg-border hover:bg-muted-foreground/50",
);
