import { tv, type VariantProps } from "tailwind-variants";

export const switchTrackVariants = tv({
  base: "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-2 border-transparent bg-input transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary",
  variants: {
    shape: {
      default: "rounded-xl",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export const switchThumbVariants = tv({
  base: "pointer-events-none block size-4 bg-background shadow-sm transition-transform duration-200 ease-out data-[checked]:translate-x-4",
  variants: {
    shape: {
      default: "rounded-[max(0px,calc(var(--radius)*1.5-2px))]",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export type SwitchRecipeProps = VariantProps<typeof switchTrackVariants>;
