import { tv, type VariantProps } from "tailwind-variants";

export const alertVariants = tv({
  base: "relative w-full rounded-lg border px-4 py-3 text-sm [&>h5]:mb-1 [&>h5]:font-medium [&>h5]:leading-none [&>p]:text-xs [&>p]:leading-relaxed",
  variants: {
    variant: {
      default: "border-border bg-card text-card-foreground [&>p]:text-muted-foreground",
      info: "border-info/30 bg-info/10 text-foreground [&>h5]:text-info",
      success: "border-success/30 bg-success/10 text-foreground [&>h5]:text-success",
      warning: "border-warning/30 bg-warning/10 text-foreground [&>h5]:text-warning",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AlertRecipeProps = VariantProps<typeof alertVariants>;
