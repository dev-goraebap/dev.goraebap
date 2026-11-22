import { cva } from "class-variance-authority";

export const checkboxVariants = cva(
  "peer relative inline-flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[4px] border border-input bg-background text-primary-foreground transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 checked:border-primary checked:bg-primary data-[checked]:border-primary data-[checked]:bg-primary [&:is(input):checked]:after:block [&:is(input):checked]:after:h-2 [&:is(input):checked]:after:w-1 [&:is(input):checked]:after:-mt-0.5 [&:is(input):checked]:after:rotate-45 [&:is(input):checked]:after:border-r-[1.8px] [&:is(input):checked]:after:border-b-[1.8px] [&:is(input):checked]:after:border-primary-foreground [&:is(input):checked]:after:content-['']",
);
