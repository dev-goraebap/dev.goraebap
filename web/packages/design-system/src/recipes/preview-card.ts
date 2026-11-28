import { tv } from "tailwind-variants";

export const previewCardPopupVariants = tv({
  base: "z-50 w-72 origin-[var(--transform-origin,center)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-[opacity,scale,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});
