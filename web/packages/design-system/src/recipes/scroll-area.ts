import { tv } from "tailwind-variants";

export const scrollAreaRootVariants = tv({
  base: "relative overflow-hidden rounded-xl border border-border bg-card",
});

export const scrollAreaViewportVariants = tv({
  base: "h-full w-full overflow-auto",
});

export const scrollAreaScrollbarVariants = tv({
  base: "flex touch-none select-none p-0.5 transition-opacity data-[orientation=vertical]:w-2 data-[orientation=horizontal]:h-2",
});

export const scrollAreaThumbVariants = tv({
  base: "relative flex-1 rounded-sm bg-border hover:bg-muted-foreground/50",
});
