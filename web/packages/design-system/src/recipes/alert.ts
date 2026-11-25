import { tv, type VariantProps } from "tailwind-variants";

export const alertVariants = tv({
  base: "relative w-full rounded-lg border px-4 py-3 text-sm [&>h5]:mb-1 [&>h5]:font-medium [&>h5]:leading-none [&>p]:text-xs [&>p]:leading-relaxed",
  variants: {
    variant: {
      default:
        "border-border bg-card text-card-foreground [&>p]:text-muted-foreground",
      info: "border-info/30 bg-info/10 text-foreground [&>h5]:text-info",
      success:
        "border-success/30 bg-success/10 text-foreground [&>h5]:text-success",
      warning:
        "border-warning/30 bg-warning/10 text-foreground [&>h5]:text-warning",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AlertRecipeProps = VariantProps<typeof alertVariants>;

export const compactAlertSlots = tv({
  slots: {
    alertTitle:
      "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
    alertDescription:
      "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
    alertAction: "absolute top-2 right-2",
  },
});

export const compactAlertVariants = tv({
  base: "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      destructive:
        "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type compactAlertRecipeProps = VariantProps<typeof compactAlertVariants>;
