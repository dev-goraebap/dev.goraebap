---
arc42: "8.5, 2"
---

# 목록 위 대화상자 마스킹

자기 주소가 있는 상세·작성·수정을 데스크톱 목록 위 대화상자로 열고, 주소창에는 대상의 실제 주소를 보입니다. 주소 계약은 [라우트 마스킹](../references/route-masking.md)에 있습니다.

## react

출처: [web/src/shared/lib/panel.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/panel.ts)

```ts
/** href를 지금 페이지 위 대화상자로 연다(휴대폰은 그 페이지로 간다). */
export function useOpenPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  return (href: string, { surface = "dialog", inherit = false, replace = false }: OpenPanelOptions = {}) => {
    const isPanel = typeof (location.search as Search)[KEY] === "string"
    const asInherit = inherit || surface === "inherit"
    if (isPageDetail(href) || isMobile || surface === "page" || (asInherit && !isPanel)) return void navigate({ href, replace })
    const target = split(href)
    // 대화상자 안에서 바꿔 열면 처음 연 기록의 표시를 이어받아, 닫기가 여전히 목록으로 한 걸음 돌아간다.
    const marker = isPanel ? location.state[MARK] : ROOT_ENTRY
    void navigate({
      replace: isPanel || replace, to: location.pathname, search: { ...(location.search as Search), [KEY]: href }, state: { [MARK]: marker },
      mask: { to: target.pathname, search: target.search, state: { [MARK]: marker } },
    })
  }
}
```

목록 주소에 `?panel=<대상 주소>`를 달고 라우터의 `mask`로 주소창에 대상 주소를 보입니다. 휴대폰과 늘 페이지로 여는 상세는 마스킹 없이 그 주소로 갑니다. 대화상자 안에서 다른 대상을 열면 기록을 replace하고 처음 연 기록의 표시를 이어받습니다.

출처: [web/src/shared/lib/panel.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/panel.ts)

```ts
export function usePanel() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { [KEY]: raw, ...rest } = location.search as Search
  const href = typeof raw === "string" && raw.startsWith("/") ? raw : undefined
  const isOpenedHere = location.state[MARK] === ROOT_ENTRY
  return {
    href,
    /** 대화상자 주소의 경로(검색 값 없이). */
    pathname: href ? split(href).pathname : undefined,
    /** 대화상자 주소의 검색 값(글자). */
    search: href ? split(href).search : {},
    close: (fallbackHref?: string) => {
      if (typeof raw === "string" && isOpenedHere) return router.history.back()
      if (typeof raw !== "string" && typeof fallbackHref === "string") return void navigate({ href: fallbackHref, replace: true })
      return void navigate({ to: location.pathname, search: rest, replace: true })
    },
    // …
    done: (next: string) => void navigate({ href: next, replace: true }),
  }
}
```

`close`는 여기서 연 대화상자면 한 걸음 뒤로 가서 처음 연 목록의 조건과 스크롤로 돌아가고, 처음 연 기록이 없으면 패널만 뺀 목록 주소로 바꿉니다. `done`은 저장한 결과 페이지로 replace합니다.

출처: [web/src/app/router/router.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/router/router.tsx)

```tsx
export const createAppRouter = (queryClient: QueryClient) => createRouter({
  // …
  // A panel's masked address (shared/lib/panel) opens as its own page on a reload.
  unmaskOnReload: true,
  // …
});
```

출처: [web/src/app/layout/PanelHost.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/layout/PanelHost.tsx)

```tsx
function usePanelContent(): { node: ReactNode; isLoading: boolean; href?: string } {
  // …
  const waiting = !!href && !isPhone && !cached && prepared.isPending;
  const held = useLoadingHold(waiting, { delay: 0, minimum: 300 });
  useEffect(() => { if (isPhone && href) expand(); }, [isPhone, href, expand]);
  // Keep the composing form mounted for this render so its layout effect can hand off the draft before expand.
  if (!href) return result(null);
  if (!isPhone && (waiting || (opening.current.cold && held))) return { node: <PanelLoading href={href} onClose={panel.close} />, isLoading: true, href };
  // …
}
```

새로고침하면 `unmaskOnReload`로 마스크를 풀어 대상 페이지로 엽니다. 휴대폰 폭에서 남은 패널 쿼리는 `PanelHost`가 `expand()`로 대상 페이지로 옮깁니다.
