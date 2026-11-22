import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cn } from "@goraebap/design-system/cn";
import {
  separatorVariants,
  type SeparatorRecipeProps,
} from "@goraebap/design-system/recipes/separator";
import type { ComponentProps } from "react";

export type SeparatorProps = ComponentProps<typeof BaseSeparator> &
  SeparatorRecipeProps & {
    variant?: "line" | "wave";
  };

export function Separator({
  className,
  orientation = "horizontal",
  variant = "line",
  ...props
}: SeparatorProps) {
  if (variant === "wave" && orientation === "horizontal") {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        data-slot="separator"
        data-variant="wave"
        className={cn("text-border flex w-full items-center justify-center py-2", className)}
      >
        <svg
          viewBox="0 0 120 10"
          fill="none"
          aria-hidden="true"
          className="h-2.5 w-28 shrink-0"
        >
          <path
            d="M2 5c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorVariants({ orientation, className }))}
      {...props}
    />
  );
}
