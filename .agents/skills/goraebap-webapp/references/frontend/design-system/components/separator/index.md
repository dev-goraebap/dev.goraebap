# Separator

서로 다른 정보 묶음이나 메뉴 구역을 시각적으로 나눌 때 씁니다. 가로 방향과 세로 방향 구분을 모두 지원하며, 긴 글이나 섹션 사이에는 물결 형태로 여유 있게 구획을 나눌 수 있습니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 변형

### Wave Divider

블로그나 문서 본문에서 섹션을 부드럽게 나눌 때 variant='wave'를 씁니다.

스택별 구현: [react.md](react.md#wave) · [angular.md](angular.md#wave)의 「wave」 절

## 접근성

- 단순 장식용 선이라면 aria-hidden="true"로 스크린 리더 탐색에서 제외합니다.
- 세로 구분선은 orientation을 vertical로 지정해 보조 기기에 방향 정보를 정확히 전달합니다.

## 관련 컴포넌트

- [Card](../card/index.md): 선으로만 나누기보다 독립된 표면으로 항목을 묶어 강조할 때 씁니다.
- [Menu](../menu/index.md): 메뉴 항목 사이의 구분은 MenuSeparator를 씁니다.
