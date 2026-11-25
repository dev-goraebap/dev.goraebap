import { cn } from "@goraebap/design-system/cn";
import {
  compactTextareaVariants,
  textareaVariants,
  type TextareaRecipeProps,
} from "@goraebap/design-system/recipes/textarea";
import type { ComponentProps } from "react";

export type TextareaProps = ComponentProps<"textarea"> &
  TextareaRecipeProps & {
    appearance?: "compact";
  };

export function Textarea({ className, invalid, appearance, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(
        appearance === "compact"
          ? compactTextareaVariants({ className })
          : textareaVariants({ invalid, className }),
      )}
      {...props}
    />
  );
}
