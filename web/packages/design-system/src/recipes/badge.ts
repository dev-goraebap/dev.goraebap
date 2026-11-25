import { tv, type VariantProps } from "tailwind-variants";

const labelStyle = "h-5.5 rounded-full bg-pressed px-2 text-foreground";
const linkStyle = "text-primary underline-offset-4 hover:underline";
const ghostStyle =
  "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50";

export const badgeVariants = tv({
  base: "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border border-border text-foreground",
      muted: "bg-muted text-muted-foreground",
      destructive: "bg-destructive/15 text-destructive",
      label: labelStyle,
      link: linkStyle,
      ghost: ghostStyle,
    },
  },
  defaultVariants: {
    variant: "secondary",
  },
});

export type BadgeRecipeProps = VariantProps<typeof badgeVariants>;

export const compactBadgeVariants = tv({
  base: "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
      secondary:
        "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
      destructive:
        "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
      outline:
        "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
      ghost: ghostStyle,
      link: linkStyle,
      /** 라벨 알약(cowork token): 색 점 + 이름, radius-full. 네모나면 버튼으로 읽힌다. */
      label: labelStyle,
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type compactBadgeRecipeProps = VariantProps<typeof compactBadgeVariants>;
