# Tabs

같은 맥락에 속한 여러 보기나 설정 구획을 한 화면 안에서 전환할 때 씁니다. 페이지 전체를 이동하지 않고 같은 자리의 콘텐츠만 바꿀 때 적합합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| Tabs | 활성 탭 상태와 패널 연결을 관리하는 최상위 컨테이너입니다. |
| TabsList | 탭 버튼들을 한 줄로 묶어 배치하는 목록 영역입니다. |
| TabsTrigger | 클릭이나 키보드로 특정 패널을 활성화하는 탭 버튼입니다. |
| TabsContent | 선택된 탭에 대응하는 본문을 표시하는 패널입니다. |

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 활성 탭과 패널 본문 사이로 포커스를 이동합니다. |
| ArrowLeft / ArrowRight | 탭 목록 안에서 이전·다음 탭으로 이동합니다. |
| Home / End | 첫 번째 또는 마지막 탭으로 바로 이동합니다. |

- 탭 라벨은 한두 단어로 짧게 써서 좁은 폭에서도 줄바꿈이나 잘림이 생기지 않게 합니다.
- 탭 전환으로 URL이 바뀌어야 하는 탐색에는 일반 링크나 라우터를 씁니다.

## 관련 컴포넌트

- [Toggle Group](../toggle-group/index.md): 본문 패널을 바꾸는 것이 아니라 정렬·보기 옵션만 고를 때 씁니다.
- [Navigation Menu](../navigation-menu/index.md): 다른 페이지로 이동하는 전역 사이트 탐색은 Navigation Menu를 씁니다.
