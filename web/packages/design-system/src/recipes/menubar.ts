import { tv } from "tailwind-variants";

export const menubarVariants = tv({
  base: "inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1",
});

export const menubarTriggerVariants = tv({
  base: "inline-flex cursor-pointer items-center rounded-md px-2.5 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:bg-accent",
});
