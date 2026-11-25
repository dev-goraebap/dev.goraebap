import { tv, type VariantProps } from "tailwind-variants";

export const fieldSlots = tv({
  slots: {
    fieldSet:
      "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
    fieldLegend:
      "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
    fieldGroup:
      "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
    fieldContent:
      "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
    fieldLabel:
      "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10 has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
    fieldLabel2:
      "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
    fieldDescription:
      "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5 last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
    fieldSeparator:
      "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
    fieldSeparatorSeparator: "absolute inset-0 top-1/2",
    fieldSeparatorContent:
      "relative mx-auto block w-fit bg-background px-2 text-muted-foreground",
    fieldErrorul: "ml-4 flex list-disc flex-col gap-1",
    fieldError: "text-sm font-normal text-destructive",
  },
});

export const fieldVariants = tv({
  base: "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  variants: {
    orientation: {
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export type fieldRecipeProps = VariantProps<typeof fieldVariants>;
