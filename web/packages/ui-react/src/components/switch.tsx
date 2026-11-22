import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@goraebap/design-system/cn";
import { switchThumbVariants, switchTrackVariants } from "@goraebap/design-system/recipes/switch";
import type { ComponentProps } from "react";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root data-slot="switch" className={cn(switchTrackVariants(), className)} {...props}>
      <BaseSwitch.Thumb data-slot="switch-thumb" className={switchThumbVariants()} />
    </BaseSwitch.Root>
  );
}
