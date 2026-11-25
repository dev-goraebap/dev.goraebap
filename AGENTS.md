# dev-goraebap

웹 앱 개발 지침 플러그인 **Webapp**(`webapp@dev-goraebap`)과, 그 지침을 사람이 읽는 사이트(dev.goraebap.xyz)를 관리합니다. 지침과 문서는 한국어로 씁니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽습니다.

| 경로 | 역할 |
| --- | --- |
| `plugins/webapp/` | Webapp 플러그인: 아직 content로 옮기지 않은 지침(`skills/`), 패키징·검사 스크립트, 생성 배포본(`dist/`) |
| `web/apps/blog/` | 지침 사이트(React). `content/`가 옮긴 지침의 원본 |
| `web/apps/sso/` | 계정·로그인 화면(Angular). Angular 예시의 원본 |
| `web/packages/` | 디자인 시스템 레시피와 React·Angular 어댑터 |
| `server/` | sso의 API(Spring). `foundation`·`shared`만 남은 이전 중 상태 |
| `docs/decisions.md` | 되돌리기 어려운 결정과 기각한 대안 |

로컬 실행은 루트에서 `sh dev.sh [all|blog|sso|server]`입니다. 의존성은 `web/`에서 pnpm으로 설치합니다.

## 작업 파일

Git으로 관리하지 않는 작업 파일(이어받기 문서, 초안, 스크린샷, 로그)은 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다.

## 스킬

이 저장소만의 작업 절차는 `.agents/skills/`의 프로젝트 스킬이 원본입니다. 작업에 맞는 스킬을 먼저 읽습니다.

| 작업 | 스킬 |
| --- | --- |
| 지침 글(content·skills)·예시·플러그인 패키징·결정 기록 | `goraebap-guidelines` |
| 지침 사이트(blog)의 화면·문서 목록·빌드·배포 | `goraebap-blog` |

Claude Code의 SessionStart 훅이 `scripts/sync-skills.mjs`로 `.claude/skills/`에 복사합니다. 세션 중에 스킬을 고쳤으면 그 스크립트를 직접 실행합니다. `.claude/skills/`는 손으로 고치지 않습니다.

커밋·푸시·배포·전역 설치는 사용자가 요청한 범위에서만 합니다. `main` 푸시는 검사 워크플로(`check.yml`)만 돌립니다.

<!-- webapp@dev-goraebap:start -->
## 개발 지침

이 프로젝트는 Webapp 플러그인(0.19.0 이상)의 지침을 따릅니다. 작업을 시작할 때 goraebap-mode를 읽고, 바꾸는 영역의 지침(webapp-project·frontend-engineering·frontend-design-system·frontend-interaction·backend-engineering)을 함께 읽습니다. 아래 프로젝트 규칙이 지침과 다르면 프로젝트 규칙을 따릅니다. Webapp 지침을 읽을 수 없거나 설치된 버전이 위 버전보다 낮으면 추측으로 진행하지 않습니다. 작업 상태를 이어받기 문서로 남기고, 플러그인 설치·갱신 방법과 새 세션에서 읽을 문서 경로를 사용자에게 알립니다.

- Webapp 스택: react, angular, spring
<!-- webapp@dev-goraebap:end -->

## 프로젝트 규칙

지침과 다르게 하는 것은 없습니다.
