import { cva } from "class-variance-authority";

export const tableVariants = cva("w-full caption-bottom text-sm");

export const tableRowVariants = cva(
  "border-b border-border/80 transition-colors hover:bg-accent/50",
);
