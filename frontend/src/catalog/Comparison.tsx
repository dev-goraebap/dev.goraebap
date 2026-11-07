import type { ReactNode } from "react";

/** 견본의 설명과 배치만 맡고 실제 부품의 크기·스타일은 변경하지 않는다. */
export function Comparison({
  items,
}: {
  items: { label: string; content: ReactNode }[];
}) {
  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "1.5rem",
        listStyle: "none",
        margin: 0,
        padding: "1rem",
        maxInlineSize: "48rem",
      }}
    >
      {items.map((item) => (
        <li
          key={item.label}
          style={{
            display: "grid",
            justifyItems: "center",
            gap: ".75rem",
            minInlineSize: 0,
          }}
        >
          {item.content}
          <span
            style={{ fontSize: ".75rem", color: "var(--color-text-secondary)" }}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
