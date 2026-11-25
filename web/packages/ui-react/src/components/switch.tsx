import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  compactSwitchSlots,
  switchThumbVariants,
  switchTrackVariants,
  type SwitchRecipeProps,
} from "@goraebap/design-system/recipes/switch";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root> &
  (
    | (SwitchRecipeProps & { appearance?: undefined; size?: never })
    | { appearance: "compact"; size?: "default" | "sm"; shape?: never }
  );

const compactStyles = compactSwitchSlots();

export function Switch({
  className,
  shape,
  appearance,
  size = "default",
  ...props
}: SwitchProps) {
  const compact = appearance === "compact";
  return (
    <BaseSwitch.Root
      data-slot="switch"
      data-size={compact ? size : undefined}
      className={mergeClassName(
        compact ? compactStyles.switch() : switchTrackVariants({ shape }),
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb
        data-slot="switch-thumb"
        className={
          compact ? compactStyles.switchThumb() : switchThumbVariants({ shape })
        }
      />
    </BaseSwitch.Root>
  );
}
