import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "@goraebap/design-system/cn";
import {
  scrollAreaRootVariants,
  scrollAreaScrollbarVariants,
  scrollAreaThumbVariants,
  scrollAreaViewportVariants,
} from "@goraebap/design-system/recipes/scroll-area";
import type { ComponentProps } from "react";

export function ScrollArea({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseScrollArea.Root>) {
  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      className={cn(scrollAreaRootVariants(), className)}
      {...props}
    >
      <BaseScrollArea.Viewport className={scrollAreaViewportVariants()}>
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar orientation="vertical" className={scrollAreaScrollbarVariants()}>
        <BaseScrollArea.Thumb className={scrollAreaThumbVariants()} />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  );
}
