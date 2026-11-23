import { cn } from "@goraebap/design-system/cn";

export { cn };

// Base UI의 className은 상태를 받는 함수일 수 있어 레시피 결과와 합칠 때 함수 형태를 유지한다.
export function mergeClassName<State>(
  base: string,
  className?: string | ((state: State) => string | undefined),
) {
  return typeof className === "function"
    ? (state: State) => cn(base, className(state))
    : cn(base, className);
}
