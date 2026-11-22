import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "@goraebap/design-system/cn";
import {
  progressIndicatorVariants,
  progressTrackVariants,
  type ProgressRecipeProps,
} from "@goraebap/design-system/recipes/progress";
import type { ComponentProps } from "react";

export type ProgressProps = ComponentProps<typeof BaseProgress.Root> & ProgressRecipeProps;

export function Progress({ className, shape, ...props }: ProgressProps) {
  return (
    <BaseProgress.Root data-slot="progress" className={cn("w-full", className)} {...props}>
      <BaseProgress.Track className={progressTrackVariants({ shape })}>
        <BaseProgress.Indicator className={progressIndicatorVariants({ shape })} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
