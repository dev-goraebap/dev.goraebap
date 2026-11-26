# 라우팅 마스크 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## open-masked

TanStack Router의 `mask`로 목록(`/posts`) 위 대화상자를 열면서 주소창만 대상 주소로 바꿉니다. 휴대폰과 직접 진입은 마스크 없이 대상 페이지를 그립니다.

```tsx
// 데스크톱: 목록(/posts) 위 대화상자를 열면서 주소창만 /posts/$id로 마스킹
<Link
  to="/posts"
  search={{ preview: post.id }}
  mask={isMobile ? undefined : { to: "/posts/$id", params: { id: post.id } }}
>
  {post.title}
</Link>

// 휴대폰 또는 새로고침(/posts/$id 직접 진입): 대상 페이지 렌더링
```

목록 주소에 `?panel=<대상 주소>`를 달고 라우터의 `mask`로 주소창에 대상 주소를 보입니다. 휴대폰과 늘 페이지로 여는 상세는 마스킹 없이 그 주소로 갑니다. 대화상자 안에서 다른 대상을 열면 기록을 replace하고 처음 연 기록의 표시를 이어받습니다.

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

`close`는 여기서 연 대화상자면 한 걸음 뒤로 가서 처음 연 목록의 조건과 스크롤로 돌아가고, 처음 연 기록이 없으면 패널만 뺀 목록 주소로 바꿉니다. `done`은 저장한 결과 페이지로 replace합니다.

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

새로고침하면 `unmaskOnReload`로 마스크를 풀어 대상 페이지로 엽니다. 휴대폰 폭에서 남은 패널 쿼리는 `PanelHost`가 `expand()`로 대상 페이지로 옮깁니다.

출처: [web/src/app/router/router.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/router/router.tsx)

```tsx
export const createAppRouter = (queryClient: QueryClient) => createRouter({
  // …
  // A panel's masked address (shared/lib/panel) opens as its own page on a reload.
  unmaskOnReload: true,
  // …
});
```

아래 예시는 캐시가 없는 패널을 곧바로(`delay: 0`) 대기 화면으로 엽니다. 기준은 [대화상자의 데이터 준비](../../../design-system/loading-feedback/index.md#대화상자의-데이터-준비)대로 150ms 뒤에 띄우고 최소 300ms 두는 것입니다.

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

## search-and-forms

전역 검색은 휴대폰이면 `/search`로 이동하고, 데스크톱이면 지금 주소에 패널 쿼리를 달고 `/search`로 마스킹합니다.

```tsx
function openSearch() {
  if (isMobile) return navigate({ to: "/search" });

  navigate({
    to: location.pathname,
    search: { ...location.search, panel: "search" },
    mask: { to: "/search", unmaskOnReload: true },
    resetScroll: false,
  });
}
```
