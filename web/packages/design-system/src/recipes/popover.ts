import { tv } from "tailwind-variants";

export const popoverPopupVariants = tv({
  base: "z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});
