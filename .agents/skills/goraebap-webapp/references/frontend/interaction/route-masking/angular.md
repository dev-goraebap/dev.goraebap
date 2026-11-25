# 라우팅 마스크 (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## open-masked

Angular Router에는 주소 마스크가 없으므로, 데스크톱은 목록을 유지한 채 대화상자를 열고 `Location.go`로 주소만 대상 주소로 바꿉니다. 휴대폰과 직접 진입은 일반 라우트로 대상 페이지를 그립니다.

```ts
// 데스크톱: 목록 맥락 유지 + 대화상자/보조 라우트로 열고 location.go('/posts/' + id)
// 휴대폰 또는 직접 진입: 일반 /posts/:id 라우트 컴포넌트로 전체 화면 렌더링
openPost(id: string) {
  if (this.isMobile()) {
    this.router.navigate(["/posts", id]);
  } else {
    this.openPreviewModal(id);
  }
}
```
