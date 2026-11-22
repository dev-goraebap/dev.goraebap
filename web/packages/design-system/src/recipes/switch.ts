import { cva } from "class-variance-authority";

export const switchTrackVariants = cva(
  "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary",
);

export const switchThumbVariants = cva(
  "pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out data-[checked]:translate-x-4",
);
