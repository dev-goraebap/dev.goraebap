# Progress

파일 업로드, 저장 용량, 단계별 완료율처럼 전체 대비 진행 정도를 수치로 보여 줄 때 씁니다. 작업이 얼마나 남았는지 막대 길이로 직관적으로 전달합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 접근성

- 진행 막대에 aria-label이나 주변 라벨을 연결해 어떤 작업의 진행률인지 알립니다.
- 막대만 두지 말고 작업 이름과 퍼센트 수치를 함께 표기해 한눈에 읽히게 합니다.

## 관련 컴포넌트

- [Skeleton](../skeleton/index.md): 진행률을 알 수 없는 초기 화면 로딩 상태에는 Skeleton을 씁니다.
- [Slider](../slider/index.md): 진행 표시가 아니라 사용자가 값을 직접 조절해야 할 때 씁니다.
