"use client";

import { commandSlots } from "@goraebap/design-system/recipes/command";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { mergeClassName } from "../lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../compact/dialog";
import { InputGroup, InputGroupAddon } from "./input-group";
import { SystemIcon } from "../icons";

const styles = commandSlots();

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={mergeClassName(styles.command(), className)}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  initialFocus,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  /** 열 때 초점을 줄 곳(검색 칸). 주지 않으면 대화상자가 정한다. */
  initialFocus?: React.ComponentProps<typeof DialogContent>["initialFocus"];
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className={styles.commandDialogDialogHeader()}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        initialFocus={initialFocus}
        className={mergeClassName(styles.commandDialogDialogContent(), className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className={styles.commandInputWrapper()}>
      <InputGroup className={styles.commandInputInputGroup()}>
        <CommandPrimitive.Input
          data-slot="command-input"
          className={mergeClassName(styles.commandInput(), className)}
          {...props}
        />
        <InputGroupAddon>
          <SystemIcon name="search" className={styles.commandInputSearchIcon()} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={mergeClassName(styles.commandList(), className)}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={mergeClassName(styles.commandEmpty(), className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={mergeClassName(styles.commandGroup(), className)}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={mergeClassName(styles.commandSeparator(), className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={mergeClassName(styles.commandItem(), className)}
      {...props}
    >
      {children}
      <SystemIcon name="check" className={styles.commandItemCheckIcon()} />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={mergeClassName(styles.commandShortcut(), className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
