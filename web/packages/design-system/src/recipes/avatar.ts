import { tv, type VariantProps } from "tailwind-variants";

export const avatarVariants = tv({
  base: "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border border-border bg-secondary font-medium text-secondary-foreground",
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
});

export const avatarImageVariants = tv({
  base: "size-full object-cover",
});

export const avatarFallbackVariants = tv({
  base: "flex size-full items-center justify-center bg-secondary font-medium text-secondary-foreground",
});

export type AvatarRecipeProps = VariantProps<typeof avatarVariants>;

export const compactAvatarSlots = tv({
  slots: {
    avatar:
      "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-foreground/10 data-[size=lg]:size-10 data-[size=sm]:size-6",
    avatarImage: "aspect-square size-full rounded-full object-cover",
    avatarFallback:
      "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
    avatarBadge:
      "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
    avatarGroup:
      "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
    avatarGroupCount:
      "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
  },
});
