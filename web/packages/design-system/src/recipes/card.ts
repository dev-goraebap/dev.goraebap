import { tv, type VariantProps } from "tailwind-variants";

export const cardVariants = tv({
  base: "rounded-xl border border-border bg-card text-card-foreground",
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      default: "p-6",
    },
    interactive: {
      false: "",
      true: "transition-colors hover:bg-accent/40",
    },
  },
  defaultVariants: {
    padding: "default",
    interactive: false,
  },
});

export type CardRecipeProps = VariantProps<typeof cardVariants>;

export const compactCardSlots = tv({
  slots: {
    card: "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
    cardHeader:
      "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
    cardTitle: "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
    cardDescription: "text-sm text-muted-foreground",
    cardAction: "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
    cardContent: "px-(--card-spacing)",
    cardFooter: "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
  },
});
