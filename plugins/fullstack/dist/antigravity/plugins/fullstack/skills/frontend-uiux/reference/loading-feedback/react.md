# 대기와 크기 전환 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## dialog-loading

준비 영역에 최소 높이를 주고, 대기 표시는 `Suspense`의 대체 화면으로 둡니다.

```tsx
<DialogContent>
  <Suspense fallback={<SearchLoading />}>
    <SearchPanel className="min-h-[24rem]" />
  </Suspense>
</DialogContent>
```
