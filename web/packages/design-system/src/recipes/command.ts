import { tv } from "tailwind-variants";

export const commandSlots = tv({
  slots: {
    command:
      "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
    commandDialogDialogHeader: "sr-only",
    commandDialogDialogContent: "overflow-hidden p-0",
    commandInputWrapper: "p-1 pb-0",
    commandInputInputGroup:
      "h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!",
    commandInput:
      "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
    commandInputSearchIcon: "size-4 shrink-0 opacity-50",
    commandList:
      "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
    commandEmpty: "py-6 text-center text-sm",
    commandGroup:
      "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
    commandSeparator: "-mx-1 h-px bg-border",
    commandItem:
      "group/command-item relative flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-accent data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
    commandItemCheckIcon:
      "ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100",
    commandShortcut:
      "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
  },
});
