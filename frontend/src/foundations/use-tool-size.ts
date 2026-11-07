import { useMediaQuery } from "@astryxdesign/core/hooks";
export function useToolSize(): "sm" | "md" {
  return useMediaQuery("(width < 64rem)") ? "sm" : "md";
}
