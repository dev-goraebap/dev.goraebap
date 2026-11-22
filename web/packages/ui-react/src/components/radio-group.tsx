import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cn } from "@goraebap/design-system/cn";
import { radioGroupVariants, radioItemVariants } from "@goraebap/design-system/recipes/radio-group";
import type { ComponentProps } from "react";

export function RadioGroup({ className, ...props }: ComponentProps<typeof BaseRadioGroup>) {
  return (
    <BaseRadioGroup
      data-slot="radio-group"
      className={cn(radioGroupVariants(), className)}
      {...props}
    />
  );
}

export function RadioGroupItem({ className, ...props }: ComponentProps<typeof BaseRadio.Root>) {
  return (
    <BaseRadio.Root
      data-slot="radio-group-item"
      className={cn(radioItemVariants(), className)}
      {...props}
    >
      <BaseRadio.Indicator className="flex items-center justify-center">
        <span className="bg-primary block size-2 rounded-full" />
      </BaseRadio.Indicator>
    </BaseRadio.Root>
  );
}
