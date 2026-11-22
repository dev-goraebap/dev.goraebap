import { cva } from "class-variance-authority";

export const otpFieldRootVariants = cva("inline-flex items-center gap-2");

export const otpFieldInputVariants = cva(
  "h-10 w-10 rounded-md border border-input bg-background text-center font-mono text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
);

export const otpFieldSeparatorVariants = cva("text-muted-foreground text-sm");
