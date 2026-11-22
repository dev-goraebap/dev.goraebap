import { cn } from "@goraebap/design-system/cn";
import {
  textareaVariants,
  type TextareaRecipeProps,
} from "@goraebap/design-system/recipes/textarea";
import type { ComponentProps } from "react";

export type TextareaProps = ComponentProps<"textarea"> & TextareaRecipeProps;

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(textareaVariants({ invalid, className }))}
      {...props}
    />
  );
}
