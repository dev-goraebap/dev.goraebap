import { tv, type VariantProps } from "tailwind-variants";

export const drawerBackdropVariants = tv({
  base: "fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
});

export const drawerViewportVariants = tv({
  base: "fixed inset-0 z-50",
});

export const drawerPopupVariants = tv({
  base: "fixed z-50 border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none transition-[opacity,translate] duration-250 ease-out",
  variants: {
    side: {
      right:
        "inset-y-0 right-0 h-full w-full max-w-sm border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
      left: "inset-y-0 left-0 h-full w-full max-w-sm border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

export type DrawerPopupRecipeProps = VariantProps<typeof drawerPopupVariants>;
