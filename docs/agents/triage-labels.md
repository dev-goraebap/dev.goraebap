# Triage 라벨

스킬은 triage 역할 다섯 개로 말합니다. 이 파일은 그 역할을 이 저장소 이슈 트래커의 실제 라벨 문자열에 잇습니다.

| mattpocock/skills 라벨 | 이 저장소 라벨 | 뜻 |
| :--- | :--- | :--- |
| `needs-triage` | `needs-triage` | 관리자가 검토해야 하는 이슈 |
| `needs-info` | `needs-info` | 보고자의 추가 정보를 기다리는 이슈 |
| `ready-for-agent` | `ready-for-agent` | 명세가 갖춰져 에이전트가 혼자 맡을 수 있는 이슈 |
| `ready-for-human` | `ready-for-human` | 사람이 구현해야 하는 이슈 |
| `wontfix` | `wontfix` | 처리하지 않을 이슈 |

스킬이 역할을 말하면(예: "에이전트 준비 라벨을 붙이라") 이 표에서 맞는 라벨 문자열을 씁니다.

다른 이름을 쓰게 되면 "이 저장소 라벨" 열만 고칩니다.

## 자율 개선 인박스 라벨 (`inbox:*`)

`fullstack:feedback` 스킬과 L1/L2 자동 감사 워크플로가 수집하는 피드백 라벨입니다.

| 라벨 | 용도 | 주간 배치 처리 방식 |
| :--- | :--- | :--- |
| `inbox:bug` | 지침 문서 오류 · 빌드/API 불일치 | 주간 묶음 PR에 직접 수정 반영 |
| `inbox:gap` | 지침에 없는 빈틈 · 권장 기준 필요 | 주간 묶음 PR에 직접 문서 보완 |
| `inbox:harvest` | 다른 프로젝트 `AGENTS.md`·`docs/` 규칙 승격 후보 | 주간 묶음 PR에 범용 규칙 반영 |
| `inbox:upgrade` | 공식문서 최신화 · 더 나은 패턴 제안 | 주간 묶음 PR에 반영 |
| `inbox:audit` | L1 정적 감사(보안·링크·중립성·성숙도) | 주간 묶음 PR에 패치·보완 반영 |
| `inbox:design` | 디자인 시스템·컴포넌트·레이아웃 불만/제안 | 코드 미수정 — 개선 초안 댓글 후 `needs-local-design` 전환 |
| `needs-local-design` | 로컬 시각 검증이 필요한 디자인 시스템 변경 | 로컬 세션에서 브라우저 확인하며 직접 수정 |
