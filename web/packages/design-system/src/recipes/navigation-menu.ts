import { cva } from "class-variance-authority";

export const navigationMenuListVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1",
);

export const navigationMenuTriggerVariants = cva(
  "inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:bg-accent",
);

export const navigationMenuPopupVariants = cva(
  "z-50 w-72 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
);

export const navigationMenuLinkVariants = cva(
  "block rounded-lg p-2.5 text-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);
