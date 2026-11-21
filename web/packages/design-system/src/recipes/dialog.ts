import { cva, type VariantProps } from "class-variance-authority";

export const dialogBackdropVariants = cva(
  "fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px] transition-opacity",
);

export const dialogPopupVariants = cva(
  "fixed z-50 w-full border border-border bg-popover text-popover-foreground shadow-lg outline-none",
  {
    variants: {
      surface: {
        dialog: "left-1/2 top-1/2 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6",
        sheet: "inset-x-0 bottom-0 rounded-t-2xl p-6 pb-8",
      },
    },
    defaultVariants: {
      surface: "dialog",
    },
  },
);

export type DialogPopupRecipeProps = VariantProps<typeof dialogPopupVariants>;
