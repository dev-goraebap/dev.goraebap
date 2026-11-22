import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@goraebap/design-system/cn";
import {
  switchThumbVariants,
  switchTrackVariants,
  type SwitchRecipeProps,
} from "@goraebap/design-system/recipes/switch";
import type { ComponentProps } from "react";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root> & SwitchRecipeProps;

export function Switch({ className, shape, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={cn(switchTrackVariants({ shape }), className)}
      {...props}
    >
      <BaseSwitch.Thumb data-slot="switch-thumb" className={switchThumbVariants({ shape })} />
    </BaseSwitch.Root>
  );
}
