import { tv } from "tailwind-variants";

export const radioGroupVariants = tv({
  base: "grid gap-2.5",
});

export const radioItemVariants = tv({
  base: "peer relative inline-flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full border border-input bg-background transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 checked:border-primary data-[checked]:border-primary [&:is(input):checked]:after:block [&:is(input):checked]:after:size-2 [&:is(input):checked]:after:rounded-full [&:is(input):checked]:after:bg-primary [&:is(input):checked]:after:content-['']",
});
