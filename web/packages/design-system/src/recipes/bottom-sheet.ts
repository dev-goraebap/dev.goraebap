import { tv } from "tailwind-variants";

export const bottomSheetBackdropVariants = tv({
  base: "fixed inset-0 z-40 bg-foreground/25 opacity-[calc(1-var(--drawer-swipe-progress,0))] backdrop-blur-[2px] transition-opacity duration-300 ease-out data-[swiping]:duration-0 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
});

export const bottomSheetViewportVariants = tv({
  base: "fixed inset-0 z-50 flex items-end justify-center",
});

export const bottomSheetPopupVariants = tv({
  base: "relative flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-b-0 border-border bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-xl outline-none [transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-300 ease-out data-[swiping]:select-none data-[swiping]:duration-0 data-[starting-style]:[transform:translateY(100%)] data-[ending-style]:[transform:translateY(100%)]",
});

export const bottomSheetHandleVariants = tv({
  base: "mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-border",
});

export const bottomSheetContentVariants = tv({
  base: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-3 pb-6",
});
