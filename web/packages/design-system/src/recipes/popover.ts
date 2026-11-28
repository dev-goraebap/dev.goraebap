import { tv } from "tailwind-variants";

export const popoverPopupVariants = tv({
  base: "z-50 w-72 origin-[var(--transform-origin,center)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-[opacity,scale,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});

export const compactPopoverSlots = tv({
  slots: {
    popoverBackdrop:
      "fixed inset-0 z-50 bg-black/20 duration-150 dark:bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
    popoverContentPositioner: "isolate z-50",
    popoverContent:
      "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
    popoverHeader: "flex flex-col gap-0.5 text-sm",
    popoverTitle: "font-medium",
    popoverDescription: "text-muted-foreground",
  },
});
