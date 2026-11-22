import { cva } from "class-variance-authority";

export const tableVariants = cva("w-full caption-bottom text-sm");

export const tableRowVariants = cva(
  "border-b border-border/80 transition-colors hover:bg-accent/50",
);

export const tableHeadVariants = cva(
  "h-9 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
);

export const tableCellVariants = cva("px-3 py-2.5 align-middle text-xs");
