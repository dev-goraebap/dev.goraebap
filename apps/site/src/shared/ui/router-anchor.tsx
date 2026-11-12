import { useRouter } from "@tanstack/react-router"
import type { ComponentProps, MouseEvent } from "react"

/**
 * 주소(href)만 아는 곳의 링크: Markdown · MDX 본문, 서버가 준 HTML의 a처럼 TanStack Link의 to로 바꿀 수 없는 것.
 * 앱 주소를 그냥 누르면 페이지를 다시 읽지 않고 라우터로 옮기고, 보조 키 · 새 창 · 다른 사이트 · 이미 막은 누름은 브라우저에 맡긴다.
 * 키트 부품의 링크는 Base UI의 render(<Link to />)나 RowLink(createLink)로 라우터에 바로 이어지므로 이것으로 감쌀 일이 없다.
 */
export function RouterAnchor({ href, target, onClick, ...props }: ComponentProps<"a">) {
  const router = useRouter()
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    const isPlain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    if (event.defaultPrevented || !isPlain || (target && target !== "_self") || !href?.startsWith("/") || href.startsWith("//")) return
    event.preventDefault()
    void router.navigate({ href })
  }
  return <a href={href} target={target} onClick={follow} {...props} />
}
