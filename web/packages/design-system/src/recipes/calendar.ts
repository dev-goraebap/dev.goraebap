import { tv } from "tailwind-variants";

export const calendarSlots = tv({
  slots: {
    calendar:
      "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
    rtlNavigation: String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180 rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
    root: "w-fit",
    months: "relative flex flex-col gap-4 md:flex-row",
    month: "flex w-full flex-col gap-4",
    nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
    navButton: "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
    monthCaption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
    dropdowns:
      "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
    dropdownRoot: "relative rounded-(--cell-radius)",
    dropdown: "absolute inset-0 bg-popover opacity-0",
    captionLabel: "font-medium select-none",
    captionPlain: "text-sm",
    captionAlternate:
      "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
    monthGrid: "w-full border-collapse",
    weekdays: "flex",
    weekday:
      "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
    week: "mt-2 flex w-full",
    weekNumberHeader: "w-(--cell-size) select-none",
    weekNumber: "text-[0.8rem] text-muted-foreground select-none",
    day: "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
    rangePlain: "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)",
    rangeAlternate: "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
    rangeStart:
      "relative isolate z-0 rounded-l-(--cell-radius) bg-control-on after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-control-on",
    rangeMiddle: "rounded-none",
    rangeEnd:
      "relative isolate z-0 rounded-r-(--cell-radius) bg-control-on after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-control-on",
    today: "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
    outside: "text-muted-foreground aria-selected:text-muted-foreground",
    disabled: "text-muted-foreground opacity-50",
    hidden: "invisible",
    chevron: "size-4",
    weekNumberCell: "flex size-(--cell-size) items-center justify-center text-center",
    dayButton:
      "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-control-on data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
  },
});
