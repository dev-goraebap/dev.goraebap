import { tv } from "tailwind-variants";

export const dialogBackdropVariants = tv({
  base: "fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
});

export const dialogPopupVariants = tv({
  base: "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none transition-all duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});

export const dialogCloseButtonVariants = tv({
  base: "absolute top-4 right-4 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
});
