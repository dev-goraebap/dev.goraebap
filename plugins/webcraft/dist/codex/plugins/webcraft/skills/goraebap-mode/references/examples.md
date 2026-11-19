---
arc42: "none"
---

# 예제 읽기

[cowork](https://github.com/dev-goraebap/cowork)는 이 지침을 적용한 대표 프로젝트입니다. 지침의 코드 링크는 cowork의 고정 커밋을 가리킵니다.

## 언제 보는가

- 프로젝트에 아직 없는 구조나 패턴을 처음 만들 때 봅니다.
- 지침 문장만으로 코드의 모양이 그려지지 않을 때 봅니다.

## 무엇이 어디 있는가

| 찾는 것 | cowork 경로 |
| --- | --- |
| 화면 라우트 | `web/src/pages`(`route.tsx`·`page.tsx`) |
| 앱 셸 | `web/src/app/layout` |
| 키트 | `web/src/shared/ui/kit` |
| 제품 공용 부품 | `web/src/shared/ui` |
| 데이터 준비 | `web/src/shared/lib/prepare.ts` |
| 화면 규칙 검사 | `web/scripts/check-ui.mjs` |
| 서버 모듈 | `server/src/main/java/xyz/goraebap/cowork/module` |
| 서버 기술 기반 | `server/src/main/java/xyz/goraebap/cowork/shared` |
| 마이그레이션 | `server/src/main/resources/db/migration` |
| 검사 명령 | `AGENTS.md`의 "실행과 검증" |

예제는 복사할 템플릿이 아니라 판단의 견본입니다. 지금 프로젝트의 AGENTS.md 규칙과 기존 코드가 예제보다 우선합니다. MCP 서버, 문서 편집기처럼 cowork에만 있는 기능은 따라 만들지 않습니다.

## 작업 절차

1. 파일 하나는 스킬의 링크를 열어 읽습니다.
2. 여러 파일을 함께 볼 때는 `git clone --depth 1 https://github.com/dev-goraebap/cowork.git <작업 기록 위치의 임시 폴더>`로 받아 읽습니다.
3. 받은 저장소는 읽기만 하고 고치거나 지금 프로젝트에서 import하지 않습니다.
