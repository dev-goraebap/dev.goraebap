# 로딩과 크기 전환 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## debounce

입력값을 250ms 늦춘 값으로 조회하고, 효과를 정리할 때 이전 요청을 `AbortController`로 취소합니다.

```ts
const debouncedQuery = useDebouncedValue(query, 250);

useEffect(() => {
  if (!debouncedQuery.trim()) return;

  const controller = new AbortController();
  fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then(setResults)
    .catch((error) => {
      if (error.name !== "AbortError") setError(error);
    });

  return () => controller.abort();
}, [debouncedQuery]);
```

## dialog-loading

준비 영역에 최소 높이를 주고, 대기 표시는 `Suspense`의 대체 화면으로 둡니다.

```tsx
<DialogContent>
  <Suspense fallback={<SearchLoading />}>
    <SearchPanel className="min-h-[24rem]" />
  </Suspense>
</DialogContent>
```
