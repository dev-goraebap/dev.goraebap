import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cn } from "@goraebap/design-system/cn";
import {
  avatarFallbackVariants,
  avatarImageVariants,
  avatarVariants,
  type AvatarRecipeProps,
} from "@goraebap/design-system/recipes/avatar";
import type { ComponentProps } from "react";

export type AvatarProps = ComponentProps<typeof BaseAvatar.Root> & AvatarRecipeProps;

export function Avatar({ className, size, ...props }: AvatarProps) {
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof BaseAvatar.Image>) {
  return (
    <BaseAvatar.Image
      data-slot="avatar-image"
      className={cn(avatarImageVariants(), className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof BaseAvatar.Fallback>) {
  return (
    <BaseAvatar.Fallback
      data-slot="avatar-fallback"
      className={cn(avatarFallbackVariants(), className)}
      {...props}
    />
  );
}
