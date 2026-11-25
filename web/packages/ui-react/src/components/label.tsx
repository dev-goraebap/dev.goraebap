"use client";

import { labelSlots } from "@goraebap/design-system/recipes/label";

import * as React from "react";
import { mergeClassName } from "../lib/utils";

const styles = labelSlots();

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={mergeClassName(styles.label(), className)}
      {...props}
    />
  );
}

export { Label };
