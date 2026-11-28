# Button

저장, 제출, 삭제처럼 누르는 즉시 실행되는 동작에 씁니다. 한 화면에는 Primary 액션을 하나만 두어 시각적 위계를 세우고, 나머지는 Secondary나 Ghost로 낮추며, 되돌리기 어려운 파괴적 동작은 Destructive 스타일로 구분합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| Container | 배경, 테두리, 반경과 호버·포커스·비활성 상태를 담당하는 버튼 영역입니다. |
| Icon | 동작의 의미를 빠르게 전달하며, 아이콘만 둘 때는 size="icon"과 aria-label을 함께 씁니다. |
| Label | 버튼을 눌렀을 때 일어나는 동작을 한두 단어로 짧게 적습니다. |

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 버튼으로 포커스를 이동합니다. |
| Enter | 포커스된 버튼을 실행합니다. |
| Space | 포커스된 버튼을 실행합니다. |

- 아이콘만 넣은 버튼(size="icon")에는 aria-label로 동작 이름을 반드시 적습니다.
- 폼 안에서 제출이 아닌 버튼에는 type="button"을 명시합니다. 링크로 합성할 때 넘길 값은 스택 글에 있습니다.

## 관련 컴포넌트

- [Toggle](../toggle/index.md): 한 번 실행하고 끝나는 동작은 Button, 눌린 상태를 유지하는 동작은 Toggle을 씁니다.
- [Toggle Group](../toggle-group/index.md): 정렬이나 보기 모드처럼 여러 옵션 중 선택 상태를 유지할 때 씁니다.
- [Menu](../menu/index.md): 한 버튼 자리에 관련 동작이 여러 개 모여 펼쳐야 할 때 씁니다.
