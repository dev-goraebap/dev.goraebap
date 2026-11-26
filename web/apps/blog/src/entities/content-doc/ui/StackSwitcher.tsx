import { Link } from "@tanstack/react-router";
import { STACK_LABELS } from "../model/content";
import { rememberStack } from "../model/stack-choice";

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
