import { cva } from "class-variance-authority";

export const alertDialogBackdropVariants = cva(
  "fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
);

export const alertDialogPopupVariants = cva(
  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none transition-[opacity,transform] duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
);
