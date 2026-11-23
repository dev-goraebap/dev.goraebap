import { tv, type VariantProps } from "tailwind-variants";

export const sliderTrackVariants = tv({
  base: "relative h-1.5 w-full grow cursor-pointer bg-secondary",
  variants: {
    shape: {
      default: "rounded-sm",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export const sliderIndicatorVariants = tv({
  base: "h-full bg-primary",
  variants: {
    shape: {
      default: "rounded-sm",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export const sliderThumbVariants = tv({
  base: "block size-4 cursor-pointer border-2 border-primary bg-background shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  variants: {
    shape: {
      default: "rounded-lg",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export const sliderNativeVariants = tv({
  base: "block h-8 w-full cursor-pointer appearance-none bg-transparent outline-none [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--primary)_var(--slider-value,0%),var(--secondary)_var(--slider-value,0%))] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-ring [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-secondary [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:bg-primary [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background",
  variants: {
    shape: {
      default:
        "[&::-webkit-slider-runnable-track]:rounded-sm [&::-webkit-slider-thumb]:rounded-lg [&::-moz-range-track]:rounded-sm [&::-moz-range-progress]:rounded-sm [&::-moz-range-thumb]:rounded-lg",
      pill: "[&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-track]:rounded-full [&::-moz-range-progress]:rounded-full [&::-moz-range-thumb]:rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

export type SliderRecipeProps = VariantProps<typeof sliderTrackVariants>;
