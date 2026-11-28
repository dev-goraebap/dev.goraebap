# Toast

저장 완료, 링크 복사, 백그라운드 작업 결과처럼 잠시 알렸다가 자동으로 사라져도 되는 비모달 알림에 씁니다. 사용자의 현재 작업을 방해하지 않고 짧은 피드백을 전달합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 접근성

- 오류 복구처럼 사용자가 꼭 읽고 대응해야 하는 중요한 메시지는 Toast 대신 [Alert](../alert/index.md)로 화면에 고정합니다.
- 토스트 문구는 사라지기 전에 읽을 수 있도록 한두 문장으로 짧게 적습니다.

## 관련 컴포넌트

- [Alert](../alert/index.md): 자동으로 사라지면 안 되는 오류나 상시 안내는 Alert를 씁니다.
- [Alert Dialog](../alert-dialog/index.md): 결과 알림이 아니라 실행 전 사용자의 확인 응답을 받아야 할 때 씁니다.
