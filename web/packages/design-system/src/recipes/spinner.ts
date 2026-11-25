import { tv } from "tailwind-variants";

export const spinnerSlots = tv({
  slots: {
    spinner:
      "size-4 shrink-0 animate-spin [animation-duration:0.8s] motion-reduce:[animation-duration:2s]",
  },
});
