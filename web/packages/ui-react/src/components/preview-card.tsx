import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { cn } from "@goraebap/design-system/cn";
import { previewCardPopupVariants } from "@goraebap/design-system/recipes/preview-card";
import type { ComponentProps } from "react";

export const PreviewCard = BasePreviewCard.Root;
export const PreviewCardTrigger = BasePreviewCard.Trigger;

export function PreviewCardContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: ComponentProps<typeof BasePreviewCard.Popup> & { sideOffset?: number }) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner sideOffset={sideOffset} className="z-50">
        <BasePreviewCard.Popup
          data-slot="preview-card-content"
          className={cn(previewCardPopupVariants(), className)}
          {...props}
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
