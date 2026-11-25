# Select

정해진 목록에서 하나의 값을 고르되 공간을 절약해야 할 때 씁니다. 선택지가 여러 개여서 화면에 모두 펼쳐 두기 부담스러운 폼이나 필터에 적합합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| Select | 선택 값과 팝업 열림 상태를 관리하는 최상위 래퍼입니다. |
| SelectTrigger | 현재 선택된 값을 보여 주고 목록을 여는 버튼입니다. |
| SelectValue | 선택된 항목의 라벨이나 자리 표시 문구를 출력합니다. |
| SelectContent | 선택지 목록을 띄우는 팝업 컨테이너입니다. |
| SelectGroup | 성격이 같은 선택지들을 묶어 정리하는 그룹입니다. |
| SelectItem | 목록 안에서 선택할 수 있는 개별 옵션입니다. |

## 접근성

| 키 | 동작 |
| - | - |
| Enter / Space | 선택 목록을 열거나 강조된 항목을 선택합니다. |
| ArrowUp / ArrowDown | 목록 안의 이전·다음 항목으로 이동합니다. |
| Esc | 값을 바꾸지 않고 목록을 닫습니다. |

- SelectTrigger에 label이나 aria-label을 연결해 어떤 항목을 고르는지 알립니다.
- 선택지가 많아 검색이 필요하면 Combobox로 전환하고, 좁은 화면에서는 Bottom Sheet 목록을 고려합니다.

## 적응형 UI

자동 전환 래퍼가 없으므로 64rem 미만에서는 useIsMobile로 분기해 BottomSheet 목록으로 보여 줍니다. 자세한 기준은 [적응형 UI](../../../interaction/adaptive-ui/index.md)에 있습니다.

## 관련 컴포넌트

- [Combobox](../combobox/index.md): 선택지가 많아 텍스트 검색으로 후보를 좁혀야 할 때 씁니다.
- [Radio Group](../radio-group/index.md): 선택지가 2\~4개뿐이라 모든 옵션을 펼쳐 두고 비교할 때 씁니다.
- [Menu](../menu/index.md): 값을 고르는 것이 아니라 즉시 실행할 동작 목록을 띄울 때 씁니다.
