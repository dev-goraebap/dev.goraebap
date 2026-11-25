import { compactInputSlots } from "@goraebap/design-system/recipes/input";
import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { mergeClassName } from "../lib/utils";

const styles = compactInputSlots();

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={mergeClassName(styles.input(), className)}
      {...props}
    />
  );
}

export { Input };
