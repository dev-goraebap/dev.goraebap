import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cn } from "@goraebap/design-system/cn";
import {
  separatorVariants,
  type SeparatorRecipeProps,
} from "@goraebap/design-system/recipes/separator";
import type { ComponentProps } from "react";

export type SeparatorProps = ComponentProps<typeof BaseSeparator> & SeparatorRecipeProps;

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorVariants({ orientation, className }))}
      {...props}
    />
  );
}
