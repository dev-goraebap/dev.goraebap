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

export const compactDialogSlots = tv({
  slots: {
    dialogOverlay:
      "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-closed:animate-out data-closed:fade-out-0",
    dialogContent:
      "fixed top-[12dvh] left-1/2 z-50 flex max-h-[76dvh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-6 overflow-hidden rounded-2xl bg-popover px-10 pt-7 pb-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-180 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
    overlayEnter: "data-open:animate-in data-open:fade-in-0",
    contentEnter:
      "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
    closeButton: "absolute top-7.5 right-8",
    closeLabel: "sr-only",
    dialogHeader: "flex flex-col gap-2 pr-10",
    dialogFooter:
      "flex shrink-0 flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end",
    dialogTitle: "font-heading text-xl leading-normal font-semibold",
    dialogDescription:
      "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
    dialogBar: "flex min-w-0 shrink-0 items-center gap-3",
    barTitle: "min-w-0 flex-1 truncate",
    barActions: "-mr-1.5 flex shrink-0 items-center gap-1",
    dialogBody:
      "-mx-10 -my-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-10 py-3 [scrollbar-width:thin] [[data-resizing]_&]:overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]",
  },
});
