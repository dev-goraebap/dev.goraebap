import { cva } from "class-variance-authority";

export const progressTrackVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
);

export const progressIndicatorVariants = cva(
  "h-full rounded-full bg-primary transition-[width] duration-300 ease-out",
);
