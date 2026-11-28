---
title: fullstack 플러그인 시작하기
summary: Claude Code, Codex, Antigravity에 fullstack 플러그인을 설치하고 goraebap-mode와 도메인 스킬을 호출하는 단계별 안내입니다.
order: 1
icon: rocket
---

이 사이트의 프론트엔드·백엔드·디자인 시스템 기준과 전역 플레이북은 `fullstack` 플러그인으로 패키징되어 배포됩니다. 모든 스킬은 일반 프로젝트에서 의도치 않게 개입하지 않도록 **명시 호출 전용**으로 동작합니다.

## 1. 플러그인 구성 이해

`fullstack` 플러그인은 전역 진입점 1개와 도메인 스킬 3개로 구성됩니다.

| 스킬 | 역할 | 상세 문서 |
| --- | --- | --- |
| `goraebap-mode` | 전역 오케스트레이터 — 프로젝트 `AGENTS.md` 확인, 전역 플레이북 분류, 도메인 스킬 조합 | [모노레포 프로젝트 구성](../playbooks/monorepo-setup/index.md) · [풀스택 기능 추가](../playbooks/fullstack-feature/index.md) |
| `frontend-engineering` | 프론트엔드 구조·상태·라우팅·렌더링·코드 스타일 | [프론트엔드 기준](../../frontend/playbooks/project-setup/index.md) |
| `frontend-uiux` | 디자인 시스템·레이아웃·화면 패턴·컴포넌트·UI 검증 | [디자인 시스템 기준](../../design-system/packages.mdx) |
| `backend-engineering` | 백엔드 컨텍스트·계층·API·오류 처리·데이터 접근 | [백엔드 기준](../../backend/playbooks/project-setup/index.md) |

## 2. 에이전트별 설치

### Claude Code

저장소 루트의 `.claude-plugin/marketplace.json`을 통해 `fullstack` 플러그인을 추가합니다.

```bash
# 마켓플레이스 등록 후 fullstack 플러그인 설치
/plugin marketplace add dev-goraebap/dev.goraebap
/plugin install fullstack@dev-goraebap
```

### Codex

저장소 루트의 `.agents/plugins/marketplace.json`을 통해 로컬 또는 원격 마켓플레이스에서 `fullstack` 플러그인을 활성화합니다.

### Antigravity

`plugins/fullstack/dist/antigravity/plugins/fullstack/` 디렉토리를 `~/.gemini/config/plugins/fullstack/`에 배치하면 자동으로 로드됩니다.

## 3. 프로젝트 연결 (`AGENTS.md`)

플러그인을 쓸 프로젝트 루트에 `AGENTS.md`(및 Claude Code용 `CLAUDE.md` 한 줄 `@AGENTS.md`)를 두고, 사용하는 스택과 프로젝트 고유 규칙을 적습니다. 자세한 작성 절차는 [프로젝트 에이전트 문서 구성](../playbooks/project-agent-docs/index.md)을 따릅니다.

## 4. 작업 유형별 호출 예시

- **모노레포 초기 세팅이나 API+화면 통합 구현**: `/fullstack:goraebap-mode`를 호출합니다. 전역 플레이북이 프로젝트 `AGENTS.md`를 먼저 읽고 필요한 도메인 스킬을 순서대로 조합합니다.
- **프론트엔드 아키텍처·상태·라우팅만 작업할 때**: `/fullstack:frontend-engineering`을 직접 호출합니다.
- **화면 레이아웃·컴포넌트·다크모드·문구만 다듬을 때**: `/fullstack:frontend-uiux`를 직접 호출합니다.
- **백엔드 API·도메인·쿼리만 작업할 때**: `/fullstack:backend-engineering`을 직접 호출합니다.
