import { cva, type VariantProps } from "class-variance-authority";

export const menuPopupVariants = cva(
  "z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
);

export const menuItemVariants = cva(
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        destructive:
          "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export const menuLabelVariants = cva("px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground");

export const menuSeparatorVariants = cva("-mx-1 my-1 h-px bg-border");

export type MenuItemRecipeProps = VariantProps<typeof menuItemVariants>;
