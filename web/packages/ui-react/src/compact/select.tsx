"use client";

import { compactSelectSlots } from "@goraebap/design-system/recipes/select";
import { ButtonStyleReset } from "./button";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { mergeClassName } from "../lib/utils";
import { usePortalContainer } from "../lib/portal-container";
import { SystemIcon } from "../icons";

const styles = compactSelectSlots();

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={mergeClassName(styles.selectGroup(), className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={mergeClassName(styles.selectValue(), className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={mergeClassName(styles.selectTrigger(), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className={styles.selectTriggerIcon()}>
        <SystemIcon name="chevronDown" className={styles.triggerChevron()} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const container = usePortalContainer();
  return (
    <SelectPrimitive.Portal container={container}>
      <ButtonStyleReset>
        <SelectPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          alignItemWithTrigger={alignItemWithTrigger}
          className={styles.selectContentPositioner()}
        >
          <SelectPrimitive.Popup
            data-slot="select-content"
            data-align-trigger={alignItemWithTrigger}
            // 목록은 가장 긴 항목만큼 넓어진다(단추보다 좁아지지는 않는다): 단추 폭에 묶으면 긴 항목이 잘린다. 안쪽 여백 4px.
            className={mergeClassName(styles.selectContent(), className)}
            {...props}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List>{children}</SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </ButtonStyleReset>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={mergeClassName(styles.selectLabel(), className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={mergeClassName(
        // 메뉴 줄과 같은 크기(MenuItem · DropdownMenu): 36px, 좌우 8px, 고른 표시 자리는 오른쪽 32px.
        styles.selectItem(),
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className={styles.selectItemItemText()}>
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className={styles.itemIndicator()} />}>
        <SystemIcon name="check" className={styles.itemCheck()} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={mergeClassName(styles.selectSeparator(), className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={mergeClassName(styles.selectScrollUpButton(), className)}
      {...props}
    >
      <SystemIcon name="chevronUp" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={mergeClassName(styles.selectScrollDownButton(), className)}
      {...props}
    >
      <SystemIcon name="chevronDown" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
