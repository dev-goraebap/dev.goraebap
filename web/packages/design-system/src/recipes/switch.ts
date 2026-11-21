import { cva } from "class-variance-authority";

export const switchTrackVariants = cva(
  "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary",
);

export const switchThumbVariants = cva(
  "pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-4",
);
