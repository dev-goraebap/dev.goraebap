# Slider

음량, 밝기, 가격 범위처럼 연속된 숫자 구간에서 값을 직관적으로 조절할 때 씁니다. 드래그 도중 화면 스크롤과 겹치지 않도록 터치 제어가 적용되어 있습니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 슬라이더 손잡이로 포커스를 이동합니다. |
| ArrowLeft / ArrowRight / ArrowUp / ArrowDown | 지정된 step 단위로 값을 줄이거나 늘립니다. |
| Home / End | 최솟값 또는 최댓값으로 즉시 이동합니다. |

- 슬라이더에 aria-label이나 aria-labelledby를 연결해 무엇을 조절하는지 알립니다.
- 현재 값을 숫자로 함께 표시해 시각적으로나 정밀 조절 시 혼동을 줄입니다.

## 관련 컴포넌트

- [Input](../input/index.md): 정확한 숫자를 직접 타이핑해 입력해야 할 때는 Input을 씁니다.
- [Progress](../progress/index.md): 사용자가 조작하는 값이 아니라 진행 상태만 보여 줄 때 씁니다.
