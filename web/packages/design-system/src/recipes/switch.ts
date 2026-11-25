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

export const compactSwitchSlots = tv({
  slots: {
    switch:
      "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-0 transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 px-[3px] data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-[color-mix(in_srgb,var(--foreground)_20%,var(--background))] data-disabled:cursor-not-allowed data-disabled:opacity-50",
    switchThumb:
      "pointer-events-none block rounded-full shadow-sm ring-0 transition-transform data-checked:bg-primary-foreground data-unchecked:bg-background dark:data-unchecked:bg-foreground group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 data-unchecked:translate-x-0",
  },
});
