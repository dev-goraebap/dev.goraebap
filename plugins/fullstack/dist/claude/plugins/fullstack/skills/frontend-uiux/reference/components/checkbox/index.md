# Checkbox

약관 동의나 목록의 다중 선택처럼 하나 이상의 항목을 독립적으로 고를 때 씁니다. 폼 제출과 함께 저장되는 선택이나 전체 선택의 부분 상태를 표현할 때 적합합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 체크박스로 포커스를 이동합니다. |
| Space | 선택 상태를 전환합니다. |

- 라벨 텍스트 전체를 클릭할 수 있도록 label 요소로 묶어 터치 영역을 넓힙니다.
- 관련된 체크박스 묶음은 fieldset과 legend로 그룹 이름을 제공합니다.

## 관련 컴포넌트

- [Switch](../switch/index.md): 저장 버튼 없이 설정을 즉시 켜고 끄는 동작은 Switch를 씁니다.
- [Radio Group](../radio-group/index.md): 여러 선택지 중 반드시 하나만 골라야 할 때 씁니다.
