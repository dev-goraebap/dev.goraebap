import type { ReactNode } from "react";

/**
 * 견본의 설명과 배치만 맡고 실제 부품의 크기 · 스타일은 변경하지 않는다. 두 키트의 견본이 함께 쓰므로 색은 shadcn 토큰
 * (text-muted-foreground)이다. 견본 iframe은 어느 키트든 tailwind.css와 html의 data-theme을 가진다.
 */
export function Comparison({ items }: { items: { label: string; content: ReactNode }[] }) {
  return (
    <ul className="m-0 flex max-w-3xl list-none flex-wrap items-end justify-center gap-6 p-4">
      {items.map((item) => (
        <li key={item.label} className="grid min-w-0 justify-items-center gap-3">
          {item.content}
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
