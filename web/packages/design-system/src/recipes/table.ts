import { tv } from "tailwind-variants";

export const tableVariants = tv({
  base: "w-full caption-bottom text-sm",
});

export const tableRowVariants = tv({
  base: "border-b border-border/80 transition-colors hover:bg-accent/50",
});

export const tableHeadVariants = tv({
  base: "h-9 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
});

export const tableCellVariants = tv({
  base: "px-3 py-2.5 align-middle text-xs",
});
