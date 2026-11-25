import { tv, type VariantProps } from "tailwind-variants";

export const selectTriggerVariants = tv({
  base: "inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      sm: "h-8 px-2.5 text-xs",
      default: "h-9 px-3 text-sm",
      lg: "h-10 px-3.5 text-sm",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export const selectPopupVariants = tv({
  base: "z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
});

export const selectItemVariants = tv({
  base: "relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-popover-foreground outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
});

export type SelectTriggerRecipeProps = VariantProps<typeof selectTriggerVariants>;

export const compactSelectSlots = tv({
  slots: {
    selectGroup: "scroll-my-1 p-1",
    selectValue: "flex flex-1 text-left",
    selectTrigger:
      "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-control-border bg-control py-2 pr-2.5 pl-3 text-sm whitespace-nowrap transition-colors hover:bg-control-hover outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-12 md:data-[size=default]:h-9 data-[size=sm]:h-7 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    selectTriggerIcon: "pointer-events-none text-muted-foreground",
    triggerChevron: "size-4",
    selectContentPositioner: "isolate z-50",
    selectContent:
      "relative isolate z-50 max-h-(--available-height) w-max max-w-(--available-width) min-w-[max(9rem,var(--anchor-width))] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
    selectLabel: "px-1.5 py-1 text-xs text-muted-foreground",
    selectItem:
      "relative flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
    selectItemItemText: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
    itemIndicator: "pointer-events-none absolute right-2 flex size-4 items-center justify-center",
    itemCheck: "pointer-events-none",
    selectSeparator: "pointer-events-none -mx-1 my-1 h-px bg-border",
    selectScrollUpButton:
      "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
    selectScrollDownButton:
      "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
  },
});
