import { tv } from "tailwind-variants";

export const comboboxInputVariants = tv({
  base: "flex h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-base text-foreground lg:text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
});

export const comboboxPopupVariants = tv({
  base: "z-50 max-h-60 min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});

export const comboboxItemVariants = tv({
  base: "flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-popover-foreground outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium",
});
