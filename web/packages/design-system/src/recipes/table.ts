import { tv, type VariantProps } from "tailwind-variants";

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

export const compactTableSlots = tv({
  slots: {
    tableContainer: "@container relative w-full",
    table:
      "w-full caption-bottom text-sm [&_tr>*:first-child]:pl-4 [&_tr>*:last-child:not([data-filler])]:pr-4",
    tableHeader:
      "sticky top-0 z-10 bg-background [&_tr]:border-b-0 [&_tr]:bg-background [&_tr]:hover:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)]",
    sizerCell: "h-0 p-0",
    fillerCell: "w-full p-0",
    tableBody: "[&>tr]:h-12 compact:[&>tr]:h-10",
    tableFooter: "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
    tableRow:
      "relative border-b bg-background transition-colors hover:bg-row-hover has-aria-expanded:bg-row-hover data-[state=selected]:bg-muted",
    tableRowth: "w-full p-0",
    tableRowtd: "w-full p-0",
    tableHead:
      "h-11 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
    tableCell: "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
    sizerWidth: "w-[calc(min(1920px,100cqw)-1rem)]",
    fitLayout: "table-auto [&_td:not([data-filler])]:w-px [&_th:not([data-filler])]:w-px",
    tableCaption: "mt-4 text-sm text-muted-foreground",
  },
});

export const tableTextVariants = tv({
  base: "block truncate",
  variants: { size: { sm: "max-w-48", md: "max-w-72", lg: "max-w-96" } },
  defaultVariants: { size: "md" },
});

export type TableTextRecipeProps = VariantProps<typeof tableTextVariants>;
