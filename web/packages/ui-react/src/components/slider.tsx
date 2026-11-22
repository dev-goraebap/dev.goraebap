import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "@goraebap/design-system/cn";
import {
  sliderIndicatorVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  type SliderRecipeProps,
} from "@goraebap/design-system/recipes/slider";
import type { ComponentProps } from "react";

export type SliderProps = ComponentProps<typeof BaseSlider.Root> & SliderRecipeProps;

export function Slider({ className, shape, ...props }: SliderProps) {
  return (
    <BaseSlider.Root data-slot="slider" className={cn("w-full py-2", className)} {...props}>
      <BaseSlider.Control className="flex w-full touch-none items-center select-none">
        <BaseSlider.Track className={sliderTrackVariants({ shape })}>
          <BaseSlider.Indicator className={sliderIndicatorVariants({ shape })} />
          <BaseSlider.Thumb className={sliderThumbVariants({ shape })} />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
