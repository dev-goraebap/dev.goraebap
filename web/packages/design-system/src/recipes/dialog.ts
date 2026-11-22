import { cva, type VariantProps } from "class-variance-authority";

export const dialogBackdropVariants = cva(
  "fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
);

export const dialogPopupVariants = cva(
  "fixed z-50 w-full border border-border bg-popover text-popover-foreground shadow-xl outline-none transition-all duration-200 ease-out",
  {
    variants: {
      surface: {
        dialog:
          "left-1/2 top-1/2 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
        sheet:
          "inset-x-0 bottom-0 rounded-t-2xl p-6 pt-3 pb-8 data-[starting-style]:translate-y-full data-[starting-style]:opacity-0 data-[ending-style]:translate-y-full data-[ending-style]:opacity-0",
      },
    },
    defaultVariants: {
      surface: "dialog",
    },
  },
);

export const dialogCloseButtonVariants = cva(
  "absolute top-4 right-4 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

export const dialogSheetHandleVariants = cva("mx-auto mb-4 h-1 w-10 rounded-full bg-border");

export type DialogPopupRecipeProps = VariantProps<typeof dialogPopupVariants>;
