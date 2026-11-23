import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-6",
      icon: "size-9",
    },
    shape: {
      default: "rounded-md",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    shape: "default",
  },
});

export type ButtonRecipeProps = VariantProps<typeof buttonVariants>;
