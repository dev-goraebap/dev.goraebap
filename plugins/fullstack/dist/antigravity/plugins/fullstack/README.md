# Fullstack 플러그인

웹 앱 풀스택 개발 기준을 `<도메인>-<영역>` 스킬 3개로 묶은 플러그인입니다. 원본 문서는 [dev.goraebap.xyz](https://dev.goraebap.xyz)의 `web/apps/blog/content/`에서 관리하며, 빌드 시 Claude Code·Codex·Antigravity용 패키지를 함께 생성합니다.

## 포함 스킬 (명시 호출 전용)

모든 스킬은 일반 프로젝트에서 의도치 않게 개입하지 않도록 명시 호출 전용으로 설정되어 있습니다. 필요할 때 스킬 이름을 지정해 호출합니다.

| 스킬 | 역할 | 주요 스택 파일 |
| --- | --- | --- |
| `frontend-uiux` | 테마·타이포그래피·간격·면 위계·레이아웃·화면 패턴·컴포넌트·UI 플레이북 | `react.md`, `angular.md` |
| `frontend-engineering` | 프론트엔드 구조·상태·데이터 흐름·라우팅·렌더링·코드 스타일·플레이북·아티클 | `react-tanstack.md`, `angular.md` |
| `backend-engineering` | 백엔드 패키지 구조·실행 흐름·API·오류 처리·데이터 접근·코드 스타일·플레이북·아티클 | `springboot.md` |

## 스킬 폴더 구조와 실행 흐름

각 스킬은 `SKILL.md`와 같은 레벨에 Diátaxis 3분면(`playbooks/`, `articles/`, `reference/`)을 평탄하게 둡니다.

1. **`SKILL.md` (얇은 라우터)**: 사용자 요청을 먼저 `playbooks/` 중 하나로 분류합니다. 해당하는 플레이북이 없으면 `reference/`에서 필요한 문서만 직접 읽습니다.
2. **`playbooks/` (작업 조합)**: 여러 `reference/` 기준을 순서대로 조합해 작업을 진행하고 체크리스트로 검증합니다.
3. **`reference/` (규칙·명세)**: 공통 기준(`index.md`)을 먼저 읽고, 프로젝트 스택에 해당하는 구현 파일만 함께 읽습니다.
4. **`articles/` (설계 판단 참고)**: 기본 구현에서는 열지 않고, 경계 판단이나 트레이드오프가 애매할 때만 참고합니다.

## 우선순위와 성숙도(`maturity`)

- 프로젝트의 `AGENTS.md`에 별도 프로젝트 규칙이 있으면 그 규칙이 우선합니다.
- 문서 상단에 `maturity`가 적혀 있으면 아래 강도로 적용합니다(`maturity`가 없으면 기본 권장 기준).
  - `stable` (안정): 기본 기준 — 예외가 없으면 그대로 따릅니다.
  - `refining` (다듬는 중): 참고 기준 — 현재 작업 맥락에 맞게 유연하게 판단·확인합니다.
