---
arc42: "none"
---

# 어댑터

Webapp 지침(`skills/`)은 스택과 프로젝트 없이 판단 기준과 그 이유만 담습니다. 어댑터(`adapters/<이름>/`)는 그 지침을 실제 오픈소스 프로젝트 하나에 적용한 스냅샷입니다. 그 프로젝트가 쓰는 스택과 버전, 라이브러리 API, 파일 이름 규칙, 컴포넌트 이름, 설정, 코드 위치는 어댑터에 있습니다. 에이전트는 영역 지침을 읽을 때마다 프로젝트가 따르는 어댑터에서 같은 영역의 파일을 함께 읽습니다.

## 함께 읽는 법

스킬 하나에 같은 이름의 어댑터 파일 하나가 짝을 이룹니다. 어댑터 폴더에는 프로젝트 전체를 소개하는 `overview.md`도 둡니다.

| 지침 | 어댑터 파일 |
| --- | --- |
| [webapp-project](../skills/webapp-project/SKILL.md) | `<어댑터>/webapp-project.md` |
| [frontend-engineering](../skills/frontend-engineering/SKILL.md) | `<어댑터>/frontend-engineering.md` |
| [frontend-design-system](../skills/frontend-design-system/SKILL.md) | `<어댑터>/frontend-design-system.md` |
| [frontend-interaction](../skills/frontend-interaction/SKILL.md) | `<어댑터>/frontend-interaction.md` |
| [backend-engineering](../skills/backend-engineering/SKILL.md) | `<어댑터>/backend-engineering.md` |

- 규칙은 지침에서 읽고, 그 규칙을 코드로 옮긴 모양은 어댑터에서 읽습니다. 어댑터에만 있는 구현을 새 규칙으로 삼지 않습니다.
- 어댑터 파일의 "지침과 다르게 정한 것" 절은 그 프로젝트만의 예외입니다. 다른 프로젝트에 옮기지 않습니다.
- 지금 프로젝트의 AGENTS.md 프로젝트 규칙과 기존 코드가 어댑터보다 우선합니다.
- 어댑터는 복사할 템플릿이 아니라 판단의 견본입니다. 어댑터 프로젝트에만 있는 기능은 따라 만들지 않습니다.
- 작업을 보고할 때 읽은 지침과 어댑터 파일을 적습니다.

## 고르는 법

1. 프로젝트 AGENTS.md에 `- Webapp 어댑터: <이름>` 줄이 있으면 그 어댑터를 읽습니다.
2. 줄이 없으면 아래 표에서 스택이 같은 어댑터를 고릅니다. 그 줄을 AGENTS.md에 더할지 사용자에게 묻고, 더할 때는 [연결](../skills/onboarding/SKILL.md#연결)을 따릅니다.
3. 스택이 맞는 어댑터가 없으면 지침만으로 작업하고, 맞는 어댑터가 없었다는 사실을 보고합니다. 나중에 프로젝트의 완성도가 올라오면 새 어댑터로 등록할 수 있습니다.

Claude Code에서는 세션을 시작할 때 플러그인 훅이 AGENTS.md의 이 줄을 읽고 어댑터 파일 목록을 맥락에 넣습니다. 다른 에이전트는 줄을 직접 확인합니다.

## 어댑터 목록

| 이름 | 도메인 | 스택 | 기준 커밋 | 파일 |
| --- | --- | --- | --- | --- |
| cowork | 프로젝트·업무·문서를 다루는 설치형 작업 공간 | 서버: Java 21·Spring Boot·jOOQ·Flyway·SQLite. 화면: React·TypeScript·Vite·TanStack Router/Query·shadcn/ui(Base UI)·Tailwind CSS v4 | `570d27d` | [개요](cowork/overview.md), [프로젝트](cowork/webapp-project.md), [프론트엔드 엔지니어링](cowork/frontend-engineering.md), [디자인 시스템](cowork/frontend-design-system.md), [인터랙션](cowork/frontend-interaction.md), [백엔드 엔지니어링](cowork/backend-engineering.md) |

## 새 어댑터를 더하는 법

어댑터는 공개 오픈소스 프로젝트만 등록합니다. 저장소 서브모듈을 두지 않고 마크다운 스냅샷과 고정 커밋 링크로 관리합니다.

1. 이 폴더 아래에 `<이름>/` 폴더를 만들고, `overview.md`와 해당 프로젝트가 다루는 영역 파일만 씁니다(예: SPA 프론트엔드가 없는 서버 렌더링 프로젝트는 `frontend-engineering.md`를 생략할 수 있습니다).
2. 파일의 모양은 `cowork/`를 따릅니다. 프론트매터 `arc42`는 짝인 지침과 같은 값, 제목은 `<이름>: <영역 이름>`, 첫 문단은 프로젝트 소개 한 줄과 짝인 지침 링크입니다. 절은 스택과 고른 이유, 지침을 어떻게 적용했나, 코드 위치, 지침과 다르게 정한 것 순서로 내용이 있는 것만 둡니다.
3. 코드 링크는 원본 공개 저장소의 고정 커밋 주소(`https://github.com/<owner>/<repo>/blob/<40자리 커밋>/<경로>`, 폴더는 `tree`)로 겁니다.
4. 위 어댑터 목록 표에 한 줄을 더합니다. 핵심 지침(`skills/`)은 고치지 않습니다.
5. `plugins/webapp/`에서 `npm run check`와 `npm run check:links`로 문서 구조와 GitHub 링크를 확인합니다.

## 어댑터 최신화

어댑터는 실시간 복제본이 아니라 완성도가 확인된 시점의 스냅샷입니다. 원본 프로젝트에 의미 있는 구조 변경이 쌓이면 다음 순서로 갱신합니다.

1. 어댑터의 `overview.md`에 적힌 기준 커밋과 원본 저장소 최신 커밋 사이의 변경(diff)을 확인합니다.
2. 구조·스택·패턴이 바뀐 영역 파일만 고치고, 코드 링크의 커밋 해시와 `overview.md`·이 파일의 기준 커밋을 새 커밋으로 올립니다.
3. `plugins/webapp/`에서 `npm run check`, `npm run check:links`, `npm run package`, `npm test`로 확인합니다.
