import { cn } from "cn"

/**
 * 불러오는 중 표시: 옅은 원 테두리 위를 짧은 호 하나가 일정한 속도로 돈다(가는 고리 호). 글자색(currentColor)을 따르고,
 * 크기는 size-*로 정한다(기본 16px). 움직임 줄이기 설정이면 천천히 돈다.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg data-slot="spinner" role="status" aria-label="Loading" viewBox="0 0 16 16" fill="none"
      className={cn("size-4 shrink-0 animate-spin [animation-duration:0.8s] motion-reduce:[animation-duration:2s]", className)} {...props}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <path d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export { Spinner }
