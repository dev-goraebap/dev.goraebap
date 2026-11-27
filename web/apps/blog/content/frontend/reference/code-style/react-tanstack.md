---
title: 코드 스타일과 네이밍 (React · TanStack)
summary: React 컴포넌트·훅 파일 명명, 파생값 직접 계산, useEffect 외부 동기화 경계와 Strict Mode 대응 기준입니다.
---

공통 코드 스타일과 파생값·부수 효과 분리 원칙은 [코드 스타일과 네이밍](./index.md)을 따릅니다.

## 1. 파일과 식별자 명명

| 대상 | 식별자 | 파일 이름 | 예시 |
| --- | --- | --- | --- |
| 일반 컴포넌트 | `PascalCase` | `PascalCase.tsx` (파일당 1개) | `ItemFilterBar.tsx` |
| 페이지 컴포넌트 | `*Page` | `*Page.tsx` | `ItemsPage.tsx` |
| 라우트 진입 파일 | `Route` (라우터 규약) | `page.tsx`, `route.tsx` | `pages/_app/items/page.tsx` |
| 커스텀 훅 | `use*` (camelCase) | `kebab-case.ts` | `use-debounced-search.ts` |
| 순수 모델 · API · 유틸 | `camelCase` / `PascalCase` 타입 | `kebab-case.ts` | `item-filter.ts`, `items.ts` |

```tree
# title: React · TanStack 라우트 슬라이스 파일 명명 예시
pages/_app/items/
  page.tsx              # TanStack Router 라우트 경계
  api/
    items.ts            # queryOptions · useMutation
  model/
    item-filter.ts      # 순수 TypeScript 계산·검증
    use-item-draft.ts   # 얇은 커스텀 훅 어댑터
  ui/
    ItemsPage.tsx       # 페이지 최상위 컴포넌트 (*Page)
    ItemFilterBar.tsx   # 화면 전용 하위 컴포넌트
```

## 2. 파생값, `useEffect`, 메모이제이션

- **파생값은 렌더 중에 계산합니다**: props나 기존 `useState`·`useQuery` 데이터에서 유도할 수 있는 값을 별도 `useState` + `useEffect`로 동기화하지 않습니다.

```tsx
// 비권장: 파생값을 useState + useEffect로 복제 동기화
const [visibleItems, setVisibleItems] = useState<Item[]>([]);
useEffect(() => {
  setVisibleItems(items.filter((item) => !item.archived));
}, [items]);

// 권장: 렌더 중 직접 계산 (항목 수가 크고 측정된 비용이 있을 때만 useMemo)
const visibleItems = items.filter((item) => !item.archived);
```

- **`useEffect`는 외부 시스템 동기화에만 씁니다**: 브라우저 이벤트 리스너, `IntersectionObserver`, `AbortController`, 외부 차트 인스턴스처럼 React 트리 밖의 시스템과 동기화할 때만 사용하고, 반드시 정리 함수를 반환합니다.
- **사용자 동작은 이벤트 핸들러에 둡니다**: 버튼 클릭 뒤 제출·알림·페이지 이동을 상태 플래그와 `useEffect`로 우회하지 않고 이벤트 핸들러와 `useMutation` 콜백에서 직접 실행합니다.
- **`useMemo` · `useCallback` 절제**: 단순 배열 필터나 일반 DOM 이벤트 핸들러에 습관적으로 붙이지 않습니다. `React.memo` 하위 컴포넌트에 안정된 참조를 넘기거나, 외부 훅 의존성 배열에 들어가거나, 프로파일링으로 비용이 확인된 계산에만 씁니다.

## 3. `StrictMode` 이중 실행 대응

React 개발 모드의 `<StrictMode>`는 컴포넌트 마운트와 `useEffect`를 한 번 더 실행해 정리 함수 누락을 조기에 드러냅니다.

- 이중 실행으로 요청이나 구독이 두 번 걸린다면 `const ranRef = useRef(false)` 같은 플래그로 막지 않습니다.
- 조회는 TanStack Query로 옮기고, 불가피한 외부 구독·타이머·요청은 정리 함수(`return () => ...`)에서 이전 자원을 해제해 멱등하게 만듭니다.
