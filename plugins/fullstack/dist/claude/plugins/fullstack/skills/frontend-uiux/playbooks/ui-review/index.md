# 화면 다듬기와 검증

화면을 완성했거나 기존 UI를 개선할 때 아래 순서로 점검하고 보완합니다.

## 1. 시각 위계와 토큰 준수 점검

1. 팔레트 색 직접 사용, 다크 변형 덮어쓰기, 임의 색 값이 없는지 [테마와 색상](../../reference/theme/index.md)과 [패턴의 글과 코드](../../reference/pattern-catalog/index.md) 기준으로 확인합니다.
2. 면 단계·경계선·모서리·그림자는 [면과 경계](../../reference/surfaces/index.md), 간격과 정렬선은 [간격과 크기](../../reference/spacing/index.md), 글자 크기·줄바꿈·숫자 정렬은 [글자](../../reference/typography/index.md)를 따르는지 확인합니다.
3. 움직임과 동작 줄이기(`prefers-reduced-motion`) 대응은 [움직임](../../reference/motion/index.md) 기준으로 확인합니다.

## 2. 상태 화면과 경계 조건 점검

1. 데이터가 비어 있을 때, 검색 결과가 없을 때, 대상이 없을 때, 요청이 실패했을 때 모두 [화면 상태](../../reference/ui-states/index.md) 기준대로 표시되는지 확인합니다.
2. 로딩 중 레이아웃 흔들림이나 대화상자 높이 튐이 없는지 [대기와 크기 전환](../../reference/loading-feedback/index.md)으로 확인합니다.

## 3. 문구·본문과 상호작용 검증

1. 버튼 라벨, 빈 상태 안내, 오류 문구, 본문 읽기·편집 스타일은 [문구·본문과 검증](../../reference/content-and-review/index.md) 기준으로 다듬습니다.
2. 키보드 포커스 순서, ESC 닫기, 행 클릭과 링크 구분이 자연스러운지 확인합니다.

## 4. 반응형·테마·확대 최종 확인

작업을 마치기 전에 아래 항목을 실제 화면에서 확인합니다.

- [ ] 데스크톱과 모바일 뷰포트 모두에서 넘침이나 겹침 없이 동작하는가? ([적응형 UI](../../reference/adaptive-ui/index.md))
- [ ] 제공하는 테마(라이트·다크 포함) 전환 시 대비와 경계가 유지되는가?
- [ ] 화면 크기 확대([화면 크기와 rem](../../reference/ui-size/index.md))와 스크롤바 동작([스크롤바](../../reference/scrollbar/index.md))이 깨지지 않는가?
- [ ] 린트·타입 검사·빌드와 화면 규칙 검사가 모두 통과하는가?
