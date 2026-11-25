"use client";

import * as React from "react";
import { calendarSlots } from "@goraebap/design-system/recipes/calendar";
import { cn } from "@goraebap/design-system/cn";
import { DayPicker, getDefaultClassNames, type DayButton, type Locale } from "react-day-picker";

import { Button, buttonVariants } from "../compact/button";
import { SystemIcon } from "../icons";

const styles = calendarSlots();

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(styles.calendar(), styles.rtlNavigation(), className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn(styles.root(), defaultClassNames.root),
        months: cn(styles.months(), defaultClassNames.months),
        month: cn(styles.month(), defaultClassNames.month),
        nav: cn(styles.nav(), defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          styles.navButton(),
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          styles.navButton(),
          defaultClassNames.button_next,
        ),
        month_caption: cn(styles.monthCaption(), defaultClassNames.month_caption),
        dropdowns: cn(styles.dropdowns(), defaultClassNames.dropdowns),
        dropdown_root: cn(styles.dropdownRoot(), defaultClassNames.dropdown_root),
        dropdown: cn(styles.dropdown(), defaultClassNames.dropdown),
        caption_label: cn(
          styles.captionLabel(),
          captionLayout === "label" ? styles.captionPlain() : styles.captionAlternate(),
          defaultClassNames.caption_label,
        ),
        month_grid: cn(styles.monthGrid(), defaultClassNames.month_grid),
        weekdays: cn(styles.weekdays(), defaultClassNames.weekdays),
        weekday: cn(styles.weekday(), defaultClassNames.weekday),
        week: cn(styles.week(), defaultClassNames.week),
        week_number_header: cn(styles.weekNumberHeader(), defaultClassNames.week_number_header),
        week_number: cn(styles.weekNumber(), defaultClassNames.week_number),
        day: cn(
          styles.day(),
          props.showWeekNumber ? styles.rangePlain() : styles.rangeAlternate(),
          defaultClassNames.day,
        ),
        // 범위의 이음 바탕: 팝오버 바탕(어두운 화면에서 muted와 같다) 위에서도 보이게 조작 면(켜짐)으로.
        range_start: cn(styles.rangeStart(), defaultClassNames.range_start),
        range_middle: cn(styles.rangeMiddle(), defaultClassNames.range_middle),
        range_end: cn(styles.rangeEnd(), defaultClassNames.range_end),
        today: cn(styles.today(), defaultClassNames.today),
        outside: cn(styles.outside(), defaultClassNames.outside),
        disabled: cn(styles.disabled(), defaultClassNames.disabled),
        hidden: cn(styles.hidden(), defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <SystemIcon
                name="chevronLeft"
                className={cn(styles.chevron(), className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <SystemIcon
                name="chevronRight"
                className={cn(styles.chevron(), className)}
                {...props}
              />
            );
          }

          return (
            <SystemIcon name="chevronDown" className={cn(styles.chevron(), className)} {...props} />
          );
        },
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className={styles.weekNumberCell()}>{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(styles.dayButton(), defaultClassNames.day, className)}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
