import { cva, type VariantProps } from "class-variance-authority";

export const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border border-border bg-secondary font-medium text-secondary-foreground",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        default: "size-10 text-sm",
        lg: "size-12 text-base",
      },
      shape: {
        default: "rounded-xl",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "default",
    },
  },
);

export const avatarImageVariants = cva("size-full object-cover");

export const avatarFallbackVariants = cva(
  "flex size-full items-center justify-center bg-secondary font-medium text-secondary-foreground",
);

export type AvatarRecipeProps = VariantProps<typeof avatarVariants>;
