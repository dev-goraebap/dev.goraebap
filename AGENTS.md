# dev-goraebap

웹 앱 풀스택 구현 기준 플러그인 **fullstack**(`goraebap-mode`, `frontend-engineering`, `frontend-uiux`, `backend-engineering`)과 그 기준을 사람이 읽는 사이트(`dev.goraebap.xyz`)를 관리합니다. 지침과 문서는 한국어로 씁니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽습니다.

| 경로 | 역할 |
| --- | --- |
| `web/apps/blog/` | 지침 사이트(React). `content/`가 지침·플러그인의 단일 원본 |
| `plugins/fullstack/` | `content/`에서 Claude·Codex·Antigravity용 `fullstack` 플러그인을 빌드·검사 (`dist/` 커밋) |
| `web/apps/react-tanstack-demo/` | React 어댑터(`ui-react`) 라이브 데모 앱. 블로그 iframe에서 렌더링 |
| `web/apps/angular-demo/` | Angular 어댑터(`ui-angular`) 라이브 데모 앱. 블로그 iframe에서 렌더링 |
| `web/packages/` | 디자인 시스템 레시피(`design-system`)와 React·Angular 어댑터(`ui-react`, `ui-angular`) |
| `docs/guides/` | 이 저장소 고유의 작업 가이드 (아래 표에서 필수 확인) |
| `docs/adr/` | 되돌리기 어려운 아키텍처 결정 기록(ADR) |

## 프로젝트 가이드 (작업 전 필수 읽기)

아래 경로·작업을 수정하기 전에 해당하는 가이드를 **반드시 먼저 읽습니다**.

| 대상 경로 · 작업 | 먼저 읽을 문서 |
| --- | --- |
| `web/apps/blog/content/` 지침 작성 · `plugins/fullstack/` 빌드·검사 | `docs/guides/guidelines.md` |
| Diátaxis 분면(튜토리얼·플레이북·아티클·레퍼런스·용어집·성숙도) 문서 작성 | `docs/guides/diataxis.md` |
| `web/apps/blog/` 화면·메뉴·검색·프리렌더·빌드·배포 | `docs/guides/blog.md` |
| 이슈 생성·조회 (`gh`) | `docs/agents/issue-tracker.md` |
| 이슈 Triage 라벨 | `docs/agents/triage-labels.md` |
| 용어집(`GLOSSARY.md`) · ADR(`docs/adr/`) 작성 | `docs/agents/domain.md` |

## 실행과 작업 원칙

- **로컬 실행**: 루트에서 `sh dev.sh [all|blog|react-demo|angular-demo]` (`web/` 의존성은 `pnpm`).
- **임시 작업 파일**: Git으로 관리하지 않는 이어받기 문서·초안·스크린샷·로그는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다.
- **저장소 위생 (자동 점검)**: 구조·플러그인·메뉴·CI·스크립트가 바뀌었거나 커밋·푸시·배포를 요청받으면, 사용자가 따로 언급하지 않아도 `README.md`·`AGENTS.md`·`docs/guides/`·`.github/workflows/`의 정합성과 추적되지 않는 로컬 파일(`.gitignore` 대상)을 먼저 점검해 함께 정리합니다.
- **승인 범위**: 커밋·푸시·배포·전역 설치는 사용자가 요청한 범위에서만 합니다.

## 구현 기준과 프로젝트 규칙

- 이 저장소의 코드를 만들거나 고칠 때는 `fullstack` 플러그인 기준을 따르며, 프로젝트 규칙이 다르면 프로젝트 규칙을 우선합니다.
- 스택: `react`, `angular`, `spring`
- 프로젝트 규칙 예외: 현재 없음
