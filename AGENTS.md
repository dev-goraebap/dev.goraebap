# dev-goraebap

웹 앱 구현 기준 스킬 **goraebap-webapp**과, 그 기준을 사람이 읽는 사이트(dev.goraebap.xyz)를 관리합니다. 지침과 문서는 한국어로 씁니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽습니다.

| 경로 | 역할 |
| --- | --- |
| `.agents/skills/goraebap-webapp/` | 배포하는 스킬. `references/`는 content에서 빌드한 결과이고 `SKILL.md`는 손으로 관리 |
| `plugins/webapp/` | 스킬 빌드·검사 스크립트와 content에 없는 지침(`skills/`: backend·playbook 쪽, 사이트만 읽음) |
| `web/apps/blog/` | 지침 사이트(React). `content/`가 옮긴 지침의 원본 |
| `web/apps/sso/` | 계정·로그인 화면(Angular). Angular 예시의 원본 |
| `web/packages/` | 디자인 시스템 레시피와 React·Angular 어댑터 |
| `server/` | sso의 API(Spring). `foundation`(사용자·파일·알림 등)과 `shared`(기술 기반) |
| `docs/adr/` | 되돌리기 어려운 결정(ADR) |

로컬 실행은 루트에서 `sh dev.sh [all|blog|sso|server]`입니다. 의존성은 `web/`에서 pnpm으로 설치합니다.

## 작업 파일

Git으로 관리하지 않는 작업 파일(이어받기 문서, 초안, 스크린샷, 로그)은 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다.

## 스킬

이 저장소만의 작업 절차는 `.agents/skills/`의 프로젝트 스킬이 원본입니다. 작업에 맞는 스킬을 먼저 읽습니다.

| 작업 | 스킬 |
| --- | --- |
| 지침 글(content·skills)·예시·스킬 빌드·결정 기록 | `goraebap-guidelines` |
| 지침 사이트(blog)의 화면·문서 목록·빌드·배포 | `goraebap-blog` |

Claude Code의 SessionStart 훅이 `scripts/sync-skills.mjs`로 `.claude/skills/`에 복사합니다. 세션 중에 스킬을 고쳤으면 그 스크립트를 직접 실행합니다. `.claude/skills/`는 손으로 고치지 않습니다.

커밋·푸시·배포·전역 설치는 사용자가 요청한 범위에서만 합니다. `main` 푸시는 검사 워크플로(`check.yml`)만 돌립니다.

## Agent skills

### 이슈 트래커

이슈는 GitHub Issues(`dev-goraebap/dev.goraebap`)에 `gh`로 남깁니다. `docs/agents/issue-tracker.md`를 봅니다.

### Triage 라벨

다섯 역할에 기본 라벨 이름(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)을 그대로 씁니다. `docs/agents/triage-labels.md`를 봅니다.

### 도메인 문서

단일 문맥입니다. 용어는 루트 `GLOSSARY.md`, 결정은 `docs/adr/`에 ADR로 둡니다. `docs/agents/domain.md`를 봅니다.

<!-- goraebap-webapp:start -->
## 구현 기준

코드를 만들거나 고칠 때 `goraebap-webapp` 스킬의 구현 기준을 따르고, 이 기준이 다른 관례와 다르면 이 기준을 우선합니다. 아래 프로젝트 규칙이 기준과 다르면 프로젝트 규칙을 따릅니다. 이 저장소에서는 스킬을 content에서 빌드하므로 `npx skills update`로 갱신하지 않습니다.

- 스택: react, angular, spring
<!-- goraebap-webapp:end -->

## 프로젝트 규칙

지침과 다르게 하는 것은 없습니다.
