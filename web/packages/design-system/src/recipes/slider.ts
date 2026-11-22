import { cva } from "class-variance-authority";

export const sliderTrackVariants = cva(
  "relative h-1.5 w-full grow cursor-pointer rounded-full bg-secondary",
);

export const sliderIndicatorVariants = cva("h-full rounded-full bg-primary");

export const sliderThumbVariants = cva(
  "block size-4 cursor-pointer rounded-full border-2 border-primary bg-background shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);
