---
arc42: "none"
---

# 예제

Webcraft 지침은 스택과 프로젝트 없이 판단 기준과 그 이유만 담습니다. 예제는 그 지침을 실제 프로젝트 하나에 적용한 견본입니다. 그 프로젝트가 쓰는 스택과 판, 라이브러리 API, 파일 이름 규칙, 부품 이름, 설정, 코드 위치는 예제에 있습니다. 에이전트는 영역 지침을 읽을 때마다 프로젝트가 따르는 예제에서 같은 영역의 파일을 함께 읽습니다.

## 함께 읽는 법

영역 지침 하나에 예제 파일 하나가 짝을 이룹니다. 예제 폴더에는 프로젝트 전체를 소개하는 `overview.md`도 둡니다.

| 지침 | 예제 파일 |
| --- | --- |
| [frontend](../../frontend/SKILL.md) | `<예제>/frontend.md` |
| [design-system](../../design-system/SKILL.md) | `<예제>/design-system.md` |
| [backend](../../backend/SKILL.md) | `<예제>/backend.md` |
| [api](../../api/SKILL.md) | `<예제>/api.md` |
| [database](../../database/SKILL.md) | `<예제>/database.md` |
| [architecture](../../architecture/SKILL.md) | `<예제>/architecture.md` |

- 규칙은 지침에서 읽고, 그 규칙을 코드로 옮긴 모양은 예제에서 읽습니다. 예제에만 있는 구현을 새 규칙으로 삼지 않습니다.
- 예제 파일의 "지침과 다르게 정한 것" 절은 그 프로젝트만의 예외입니다. 다른 프로젝트에 옮기지 않습니다.
- 지금 프로젝트의 AGENTS.md 프로젝트 규칙과 기존 코드가 예제보다 우선합니다.
- 예제는 복사할 템플릿이 아니라 판단의 견본입니다. 예제 프로젝트에만 있는 기능은 따라 만들지 않습니다.
- 작업을 보고할 때 읽은 지침과 예제 파일을 적습니다.

## 고르는 법

1. 프로젝트 AGENTS.md에 `- Webcraft 예제: <이름>` 줄이 있으면 그 예제를 읽습니다.
2. 줄이 없으면 아래 표에서 스택이 같은 예제를 고릅니다. 그 줄을 AGENTS.md에 더할지 사용자에게 묻고, 더할 때는 [연결](../../onboarding/SKILL.md#연결)을 따릅니다.
3. 스택이 맞는 예제가 없으면 지침만으로 작업하고, 맞는 예제가 없었다는 사실을 보고합니다.

Claude Code에서는 세션을 시작할 때 플러그인 훅이 AGENTS.md의 이 줄을 읽고 예제 파일 목록을 맥락에 넣습니다. 다른 에이전트는 줄을 직접 확인합니다.

## 예제 목록

| 이름 | 도메인 | 스택 | 파일 |
| --- | --- | --- | --- |
| cowork | 프로젝트·업무·문서를 다루는 설치형 작업 공간 | 서버: Java 21·Spring Boot·jOOQ·Flyway·SQLite. 화면: React·TypeScript·Vite·TanStack Router/Query·shadcn/ui(Base UI)·Tailwind CSS v4 | [개요](cowork/overview.md), [아키텍처](cowork/architecture.md), [API](cowork/api.md), [DB](cowork/database.md), [백엔드](cowork/backend.md), [프론트엔드](cowork/frontend.md), [디자인 시스템](cowork/design-system.md) |

## 새 예제를 더하는 법

1. 예제 프로젝트의 저장소를 이 저장소 루트의 `examples/<이름>` 서브모듈로 더하고 커밋 하나에 고정합니다. 서브모듈은 읽기 전용입니다.
2. 이 폴더 아래에 `<이름>/` 폴더 하나를 만들고, cowork와 같은 파일 이름(`overview.md`와 영역 파일)으로 씁니다. 그 프로젝트에 없는 영역의 파일은 만들지 않습니다.
3. 파일의 모양은 cowork 예제를 따릅니다. 프론트매터 `arc42`는 짝인 지침과 같은 값, 제목은 `<이름>: <영역 이름>`, 첫 문단은 프로젝트 소개 한 줄과 짝인 지침 링크입니다. 절은 스택과 고른 이유, 지침을 어떻게 적용했나, 코드 위치, 지침과 다르게 정한 것 순서로 내용이 있는 것만 둡니다.
4. 코드 링크는 서브모듈과 같은 커밋의 고정 주소(`blob/<커밋>/<경로>`, 폴더는 `tree`)로 겁니다. 지금 `npm run check`는 cowork 링크만 서브모듈과 대조하므로, 새 저장소를 더하면 검사 스크립트에도 그 저장소를 더합니다.
5. 위 예제 목록 표에 한 줄을 더합니다. 지침은 고치지 않습니다.
