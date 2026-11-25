import {
  inputGroupAddonVariants,
  type inputGroupAddonRecipeProps,
  inputGroupButtonVariants,
  type inputGroupButtonRecipeProps,
  inputGroupSlots,
} from "@goraebap/design-system/recipes/input-group";
import * as React from "react";

import { mergeClassName } from "../lib/utils";

import { Button } from "../compact/button";
import { Input } from "../compact/input";
import { Textarea } from "./textarea";

const styles = inputGroupSlots();

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={mergeClassName(styles.inputGroup(), className)}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & inputGroupAddonRecipeProps) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={mergeClassName(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  inputGroupButtonRecipeProps & {
    type?: "button" | "submit" | "reset";
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={mergeClassName(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={mergeClassName(styles.text(), className)} {...props} />;
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={mergeClassName(styles.input(), className)}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      appearance="compact"
      data-slot="input-group-control"
      className={mergeClassName(styles.textarea(), className)}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
