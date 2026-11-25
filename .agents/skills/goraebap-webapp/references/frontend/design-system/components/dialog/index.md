# Dialog

현재 화면의 맥락을 유지한 채 짧은 입력 폼이나 설정을 빠르게 마쳐야 할 때 씁니다. 배경 작업을 잠시 멈추고 사용자의 주의를 모으는 모달로, 작업을 끝내면 원래 자리로 돌아옵니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| Dialog | 모달의 열림 상태와 오버레이 컨텍스트를 관리하는 최상위 래퍼입니다. |
| DialogTrigger | 클릭이나 키보드 입력으로 모달을 여는 트리거 요소입니다. |
| DialogContent | 백드롭과 패널 본체를 렌더링하며 기본 닫기 버튼을 포함합니다(showCloseButton=\{false}로 숨길 수 있습니다). |
| DialogHeader | 제목과 보조 설명을 상단에 묶어 배치하는 영역입니다. |
| DialogTitle | 모달의 목적을 알리는 제목이며 스크린 리더의 레이블로 연결됩니다. |
| DialogDescription | 작업의 맥락이나 주의 사항을 한두 문장으로 보충하는 설명입니다. |
| DialogFooter | 좁은 화면에서는 버튼을 세로로 쌓고, 넓은 화면(sm 이상)에서는 가로로 나란히 배치합니다. |
| DialogClose | 취소 버튼 등 내부 동작으로 모달을 닫을 때 감싸는 요소입니다. |

## 변형

### Responsive

넓은 화면에서는 중앙 모달, 좁은 화면에서는 바텀시트로 자동 전환합니다.

스택별 구현: [react.md](react.md#responsive) · [angular.md](angular.md#responsive)의 「responsive」 절

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 모달 안의 다음 포커스 가능한 요소로 이동합니다. |
| Shift+Tab | 모달 안의 이전 포커스 가능한 요소로 이동합니다. |
| Esc | 모달을 닫고 열었던 트리거로 포커스를 되돌립니다. |

- DialogTitle은 스크린 리더가 모달 이름을 읽을 수 있도록 반드시 포함합니다.
- 닫기 버튼을 showCloseButton=\{false}로 숨긴 경우에도 DialogClose로 닫는 경로를 남겨 둡니다.

## 적응형 UI

64rem 미만에서는 ResponsiveDialog가 중앙 모달을 BottomSheet로 자동 전환합니다. 자세한 기준은 [적응형 UI](../../../interaction/adaptive-ui/index.md)에 있습니다.

## 관련 컴포넌트

- [Alert Dialog](../alert-dialog/index.md): 바깥 클릭으로 닫혀서는 안 되는 파괴적 확인은 Alert Dialog를 씁니다.
- [Bottom Sheet](../bottom-sheet/index.md): 화면 아래에서 올라와 끌어내려 닫는 모바일 패널이 필요할 때 씁니다.
- [Popover](../popover/index.md): 배경을 막지 않고 트리거 옆에 짧은 설정이나 안내만 띄울 때 씁니다.
