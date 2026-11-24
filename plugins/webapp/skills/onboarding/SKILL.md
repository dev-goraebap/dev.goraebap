---
name: onboarding
description: 사용자가 Webapp 연결·사본 전환·프로젝트 규칙 정리·지침 제안 처리를 요청했을 때만 씁니다. 일반 제품 구현에는 쓰지 않습니다.
arc42: "none"
---

# 프로젝트와 지침 연결

프로젝트는 지침 사본을 두지 않습니다. 지침의 원본은 사용자 범위에 설치한 Webapp 플러그인이고, 프로젝트에는 AGENTS.md 하나만 둡니다. AGENTS.md는 플러그인 지침을 따른다고 밝히고, 이 프로젝트만 다르게 하는 규칙을 적습니다. 플러그인을 갱신하면 모든 연결된 프로젝트가 새 지침을 따릅니다.

요청에 맞는 절차 하나를 수행합니다. 커밋·푸시·플러그인 설치는 사용자가 요청했을 때만 합니다.

| 요청 | 절차 |
| --- | --- |
| 새 프로젝트를 지침에 연결 | [연결](#연결) |
| 프로젝트만 다르게 하는 규칙 추가·정리 | [프로젝트 규칙](references/project-rules.md) |
| 사본 방식(`.agents/skills`의 지침 사본·동기화 훅)에서 바꾸기 | [사본에서 전환](references/migrate-from-copies.md) |
| 0.16.0 이전 스킬 이름(frontend·ui-ux·backend·api·database·architecture)을 새 이름으로 바꾸기 | [스킬 이름 이전](references/rename-skills.md) |
| 프로젝트 규칙 중 공통으로 올릴 것 찾기·반영된 규칙 정리 | [회수](#회수) |
| 지침 제안 올리기·검토 | [지침 제안](references/proposals.md) |

## 연결

1. 현재 폴더의 Git 루트, status와 staging, 기존 AGENTS.md·CLAUDE.md·`.agents/skills`를 읽습니다. 다른 저장소는 바꾸지 않습니다.
2. 지침 사본(접두사가 붙은 `*-mode`·`*-frontend` 같은 지침 폴더, `scripts/sync-skills.mjs`, 동기화 시작 훅)이 있으면 연결 대신 [사본에서 전환](references/migrate-from-copies.md)을 따릅니다.
3. AGENTS.md에 아래 "개발 지침" 관리 블록(`<!-- webapp@dev-goraebap:start -->` ~ `<!-- webapp@dev-goraebap:end -->`)과 "프로젝트 규칙" 표를 넣습니다. 파일이 없으면 만들고, 이미 마커가 있으면 마커 안쪽만 갱신합니다. 마커 밖의 기존 프로젝트 설명·팀 규칙·프로젝트 규칙 표는 보존합니다. 최소 버전은 설치된 플러그인의 버전(`plugin.json`의 `version`)으로 적습니다.
4. 블록의 `Webapp 어댑터:` 줄에 프로젝트가 따를 어댑터 이름을 적습니다. [어댑터](../../adapters/README.md)의 고르는 법에 따라 스택이 같은 어댑터를 고르고 사용자에게 확인합니다. 맞는 어댑터가 없으면 이 줄을 빼고, 지침만으로 작업한다고 사용자에게 알립니다.
5. 기존 AGENTS.md에 지침과 다른 결정이 이미 있으면 [프로젝트 규칙](references/project-rules.md) 표로 옮깁니다. 확인할 수 없는 의도는 추정하지 말고 사용자에게 묻습니다.
6. Claude Code 사용자에게는 이 마켓플레이스의 자동 갱신을 켤지 한 번 묻고 켜는 방법(`/plugin` → Marketplaces → `dev-goraebap` → Enable auto-update, 또는 조직 관리 설정의 `extraKnownMarketplaces` 항목에 `"autoUpdate": true` 추가)을 안내합니다. 사용자 설정 파일은 에이전트가 임의로 고치지 않습니다.
7. 바꾼 파일과 남은 확인 사항을 보고합니다.

```markdown
<!-- webapp@dev-goraebap:start -->
## 개발 지침

이 프로젝트는 Webapp 플러그인(0.16.0 이상)의 지침을 따릅니다. 작업을 시작할 때 goraebap-mode를 읽고, 바꾸는 영역의 지침(webapp-project·frontend-engineering·frontend-design-system·frontend-interaction·backend-engineering)을 함께 읽습니다. 아래 프로젝트 규칙이 지침과 다르면 프로젝트 규칙을 따릅니다. Webapp 지침을 읽을 수 없거나 설치된 버전이 위 버전보다 낮으면 추측으로 진행하지 않습니다. 작업 상태를 이어받기 문서로 남기고, 플러그인 설치·갱신 방법과 새 세션에서 읽을 문서 경로를 사용자에게 알립니다.

- Webapp 어댑터: <이름>
<!-- webapp@dev-goraebap:end -->

## 프로젝트 규칙

| 지침 | 지침의 기준 | 이 프로젝트 | 이유 |
| --- | --- | --- | --- |
```

관리 블록은 HTML 주석 마커(`<!-- webapp@dev-goraebap:start -->` ~ `<!-- webapp@dev-goraebap:end -->`)로 감싸 프로젝트 고유 문서와 경계를 나눕니다. 렌더링된 Markdown에는 보이지 않으며, 여러 플러그인을 함께 연결해도 식별자별 마커가 충돌하지 않습니다. `## 프로젝트 규칙` 표는 프로젝트가 직접 관리하는 예외이므로 마커 밖에 둡니다. 플러그인이 설치되지 않았거나 꺼져 있으면 플러그인의 어떤 지침도 읽히지 않고 AGENTS.md만 읽히므로, 지침을 읽을 수 없을 때의 행동 문장까지 블록에 넣습니다. `Webapp 어댑터:` 줄은 영역 지침과 함께 읽을 어댑터를 정합니다(뜻과 자리는 [프로젝트 규칙](references/project-rules.md#webapp-어댑터-줄)). 표가 비어 있으면 표 대신 "지침과 다르게 하는 것은 없습니다."라고 적습니다. 개인 설치 경로나 플러그인 내부 파일 경로는 AGENTS.md에 넣지 않습니다.

## 회수

프로젝트 규칙 중 다른 프로젝트에도 맞는 것을 찾고, 플러그인 갱신 뒤 이미 반영된 규칙을 정리합니다. 제품 고유의 업무 규칙, 회사 정보, 실험 중인 결정은 회수 후보에서 제외합니다.

1. 플러그인이 갱신됐으면 원본 저장소(`dev-goraebap/dev.goraebap`)의 닫힌 제안 이슈와 `AGENTS.md`의 프로젝트 규칙 표를 대조해 지침이나 어댑터에 반영된 줄은 지우고, 버려진 줄은 예외로 남깁니다.
2. 남은 프로젝트 규칙 가운데 공통으로 올릴 후보를 사용자와 확인한 뒤 [지침 제안](references/proposals.md)에 따라 중복 이슈를 확인하고 일반화한 이슈 본문 초안을 사용자에게 보이고 승인을 받아 원본 저장소 이슈로 올립니다. 프로젝트 규칙 표에는 이슈 번호나 제안 표시를 붙이지 않습니다.
