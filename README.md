# dev-goraebap

여러 프로젝트를 진행하며 정리한 레포 구조·프론트엔드·백엔드 구현 기준을 스킬 하나(`goraebap-webapp`)로 관리하는 저장소입니다. 같은 기준을 사람이 읽는 사이트([dev.goraebap.xyz](https://dev.goraebap.xyz))로도 보여 줍니다.

## 설계 방식

- **글 하나에서 사이트와 스킬을 함께**: 지침 글의 원본은 사이트의 `web/apps/blog/content/`입니다. 같은 글이 사이트 페이지가 되고, 빌드하면 스킬 `.agents/skills/goraebap-webapp/`이 됩니다. content에 없는 지침(backend-engineering, 글쓰기 기준 등)은 `plugins/webapp/skills/`에 있고 사이트만 읽습니다.
- **공통 글과 스택 글 분리**: 공통 글은 특정 기술 스택에 묶이지 않는 판단 기준만 담습니다. 스택별 구현은 공개 오픈소스 고정 커밋에서 발췌한 코드로 스택 글(`react`·`angular`·`spring`)에 둡니다.
- **구현 기준만**: 요구사항·명세·리뷰 같은 작업 절차는 외부 하네스에 맡깁니다([ADR 0002](docs/adr/0002-implementation-only.md)).
- **디자인 시스템 레지스트리**: 스타일 레시피와 프레임워크별 어댑터(React, Angular)를 [dev.goraebap.xyz/r](https://dev.goraebap.xyz/r/registry.json)에서 통째로 받아 씁니다.

## 저장소 구성

| 경로 | 내용 |
| --- | --- |
| `.agents/skills/goraebap-webapp/` | 배포하는 스킬. content에서 빌드한 결과를 커밋합니다 |
| `web/apps/blog/` | 지침 사이트 dev.goraebap.xyz (React)와 지침 원본 `content/` |
| `plugins/webapp/` | 스킬 빌드·검사 도구와 content에 없는 지침 |
| `web/apps/sso/` | 계정·로그인 화면 (Angular) |
| `web/packages/` | 디자인 시스템 레시피와 React·Angular 어댑터 |
| `server/` | sso의 API (Spring) |
| `docs/adr/` | 되돌리기 어려운 결정 |

로컬 실행은 `web/`에서 `pnpm install`을 한 뒤 루트에서 `sh dev.sh [all|blog|sso|server]`로 합니다.

## 설치

프로젝트 루트에서 스킬을 받아 커밋합니다.

```text
npx skills add https://github.com/dev-goraebap/dev.goraebap/tree/main/.agents/skills/goraebap-webapp
```

Codex·Cursor·Antigravity 등은 `.agents/skills/`를 바로 읽습니다. Claude Code는 `.claude/skills/`를 읽으므로 `.claude/`를 gitignore하고, `.claude/settings.json`의 SessionStart 훅에서 사본을 만듭니다([ADR 0004](docs/adr/0004-claude-copy-by-hook.md)).

```text
npx -y skills@1.7.2 add ./.agents/skills --skill "*" -a claude-code --copy -y
```

## 업데이트

갱신은 필요할 때 프로젝트에서 직접 합니다([ADR 0003](docs/adr/0003-explicit-update.md)).

```text
npx skills update goraebap-webapp -p -y
```
