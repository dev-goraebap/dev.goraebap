import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import {
  toggleGroupVariants,
  type ToggleGroupRecipeProps,
} from "@goraebap/design-system/recipes/toggle-group";
import type { ComponentProps } from "react";
import { mergeClassName } from "../lib/utils";

export type ToggleGroupProps = ComponentProps<typeof BaseToggleGroup> & ToggleGroupRecipeProps;

export function ToggleGroup({ className, shape, ...props }: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      className={mergeClassName(toggleGroupVariants({ shape }), className)}
      {...props}
    />
  );
}

export { Toggle as ToggleGroupItem } from "./toggle";
export { toggleGroupVariants };
