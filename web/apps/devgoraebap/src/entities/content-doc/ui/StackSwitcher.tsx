import { Link } from "@tanstack/react-router";
import { STACK_LABELS } from "../model/content";

const KEY = (space: string) => `goraebap-stack-${space}`;

// 고른 스택을 기억해 스택 없는 주소로 들어와도 같은 스택으로 연다. 저장하지 못하면 첫 스택을 쓴다.
export function storedStack(space: string, stacks: readonly string[]) {
  if (typeof window === "undefined") return stacks[0];
  try {
    const stored = window.localStorage.getItem(KEY(space));
    return stored && stacks.includes(stored) ? stored : stacks[0];
  } catch {
    return stacks[0];
  }
}

export function rememberStack(space: string, stack: string) {
  try {
    window.localStorage.setItem(KEY(space), stack);
  } catch {
    // 저장하지 못해도 주소가 스택을 가진다.
  }
}

// 사이드바 맨 위의 스택 선택기. 같은 문서의 다른 스택 주소로 가는 링크라 새 탭·공유에서도 같은 화면이 열린다.
export function StackSwitcher({
  space,
  stacks,
  current,
  hrefFor,
}: {
  space: string;
  stacks: readonly string[];
  current: string;
  hrefFor: (stack: string) => string;
}) {
  if (stacks.length < 2) return null;
  return (
    <nav aria-label="스택" className="bg-muted/60 flex gap-1 rounded-full p-1">
      {stacks.map((stack) => (
        <Link
          key={stack}
          to={hrefFor(stack)}
          aria-current={stack === current ? "true" : undefined}
          onClick={() => rememberStack(space, stack)}
          className={
            stack === current
              ? "bg-background text-foreground flex-1 rounded-full px-3 py-1 text-center text-sm font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground flex-1 rounded-full px-3 py-1 text-center text-sm transition-colors"
          }
        >
          {STACK_LABELS[stack] ?? stack}
        </Link>
      ))}
    </nav>
  );
}
