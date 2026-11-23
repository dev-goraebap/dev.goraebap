import { tv } from "tailwind-variants";

export const otpFieldRootVariants = tv({
  base: "inline-flex items-center gap-2",
});

export const otpFieldInputVariants = tv({
  base: "h-10 w-10 rounded-md border border-input bg-background text-center font-mono text-base font-medium lg:text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
});

export const otpFieldSeparatorVariants = tv({
  base: "text-muted-foreground text-sm",
});
