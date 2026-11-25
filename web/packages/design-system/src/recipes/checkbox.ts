import { tv } from "tailwind-variants";

export const checkboxVariants = tv({
  base: "peer relative inline-flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-sm border border-input bg-background text-primary-foreground transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 checked:border-primary checked:bg-primary data-[checked]:border-primary data-[checked]:bg-primary [&:is(input):checked]:after:block [&:is(input):checked]:after:h-2 [&:is(input):checked]:after:w-1 [&:is(input):checked]:after:-mt-0.5 [&:is(input):checked]:after:rotate-45 [&:is(input):checked]:after:border-r-[1.8px] [&:is(input):checked]:after:border-b-[1.8px] [&:is(input):checked]:after:border-primary-foreground [&:is(input):checked]:after:content-['']",
});

export const compactCheckboxSlots = tv({
  slots: {
    checkbox:
      "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary",
    checkboxIndicator: "grid place-content-center text-current transition-none [&>svg]:size-3.5",
  },
});
