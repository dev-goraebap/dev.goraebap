import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "@goraebap/design-system/cn";
import {
  progressIndicatorVariants,
  progressTrackVariants,
} from "@goraebap/design-system/recipes/progress";
import type { ComponentProps } from "react";

export type ProgressProps = ComponentProps<typeof BaseProgress.Root>;

export function Progress({ className, ...props }: ProgressProps) {
  return (
    <BaseProgress.Root data-slot="progress" className={cn("w-full", className)} {...props}>
      <BaseProgress.Track className={progressTrackVariants()}>
        <BaseProgress.Indicator className={progressIndicatorVariants()} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
