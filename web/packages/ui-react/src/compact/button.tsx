import {
  compactButtonVariants as buttonVariants,
  type CompactButtonRecipeProps,
} from "@goraebap/design-system/recipes/button";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn, mergeClassName } from "../lib/utils";
import { createContext, useContext, type ReactNode } from "react";

type ButtonVariant = NonNullable<CompactButtonRecipeProps["variant"]>;
type ButtonSize = NonNullable<CompactButtonRecipeProps["size"]>;

/**
 * 한 묶음 안의 단추 모양(칸 머리의 둥근 도구 줄, 휴대폰 앱 바의 알약). 묶음이 단추를 하위 선택자로 덮어쓰지 않고 이 값으로
 * 정한다: 변형을 바꾸는 규칙(예: ghost → tool), 크기, 마지막에 붙일 클래스. 포털(팝오버 · 시트 · 대화상자)은 이 값을 끊는다.
 */
export type ButtonStyle = {
  variant?: (variant: ButtonVariant) => ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const ButtonStyleContext = createContext<ButtonStyle | null>(null);

/** 안의 단추들(Button)의 모양을 정한다. */
export function ButtonStyleProvider({
  value,
  children,
}: {
  value: ButtonStyle | null;
  children: ReactNode;
}) {
  return <ButtonStyleContext value={value}>{children}</ButtonStyleContext>;
}

/** 포털로 뜨는 것(메뉴 · 시트 · 대화상자)의 단추는 연 자리의 묶음 모양을 따르지 않는다. */
export function ButtonStyleReset({ children }: { children: ReactNode }) {
  return <ButtonStyleContext value={null}>{children}</ButtonStyleContext>;
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & CompactButtonRecipeProps) {
  const group = useContext(ButtonStyleContext);
  const shown = group?.variant?.(variant ?? "default") ?? variant;
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={shown}
      className={mergeClassName(
        buttonVariants({ variant: shown, size: group?.size ?? size }),
        typeof className === "function"
          ? (state) => cn(className(state), group?.className)
          : cn(className, group?.className),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
