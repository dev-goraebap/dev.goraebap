# 입력 지연과 요청 취소 (react)

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
