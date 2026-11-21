/** 툴바 도구(필터 · 표시) 귀퉁이의 점: 걸렸거나 처음과 다를 때. 개수는 읽기용 이름에만 둔다. */
export function ToolDot({ label }: { label: string }) {
  return <span role="status" aria-label={label} className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
}
