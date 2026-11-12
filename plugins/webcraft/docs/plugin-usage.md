# Webcraft 플러그인

웹 플랫폼 개발 지침(프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처)입니다. 사용자 범위에 설치하면 에이전트가 작업에 맞는 지침을 스스로 불러 씁니다.

Claude Code:

```text
/plugin marketplace add dev-goraebap/dev.goraebap --scope user
/plugin install webcraft@dev-goraebap --scope user
```

Codex:

```text
codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webcraft@dev-goraebap
```

## 프로젝트에 연결

프로젝트에서 manage-workflow에 연결을 요청합니다. 에이전트가 AGENTS.md에 "개발 지침" 블록(이 플러그인을 따른다는 문장)과 "프로젝트 규칙" 표를 넣습니다. 프로젝트에 지침 사본, 동기화 스크립트, 시작 훅을 만들지 않습니다.

프로젝트만 다르게 하는 결정은 프로젝트 규칙 표에 한 줄씩 적습니다. 에이전트는 지침보다 이 표를 먼저 따릅니다. 다른 프로젝트에도 맞는 규칙은 manage-workflow의 회수로 플러그인 원본 수정을 제안받습니다.

지침 사본(`.agents/skills/<접두사>-mode` 등)이나 동기화 훅이 있는 프로젝트는 manage-workflow에 사본에서 전환을 요청합니다. 사본에서 고친 부분은 프로젝트 규칙으로 옮기고, 사본·스크립트·훅은 확인을 받은 뒤 지웁니다.

## 갱신

플러그인을 갱신하면 연결된 모든 프로젝트가 새 지침을 따릅니다. 프로젝트 AGENTS.md의 최소 판보다 낮은 플러그인이 설치돼 있거나 지침을 읽을 수 없으면 에이전트는 추측으로 진행하지 않고, 작업 상태를 `~/.goraebap/handoff/` 아래 이어받기 문서로 남긴 뒤 설치·갱신 방법과 새 세션에서 읽을 문서 경로를 안내합니다. 커밋·푸시·외부 전송은 이 플러그인 설치만으로 허용되지 않습니다.

Claude Code에서 자동 갱신은 공식 마켓플레이스가 아니면 기본값이 꺼짐입니다. 사용자가 `/plugin` → Marketplaces → `dev-goraebap` → Enable auto-update로 켜거나, 조직 관리자가 managed settings의 `extraKnownMarketplaces` 항목에 `"autoUpdate": true`를 넣습니다. 자동 갱신은 세션 시작 때가 아니라 첫 메시지 뒤 최대 10분 안에 돌며, 실행 중인 세션은 시작할 때의 판을 유지하고 `/reload-plugins`를 입력하거나 다음에 실행할 때 새 판이 적용됩니다.

Claude Code 배포본에는 세션 시작 훅(`hooks/hooks.json`, `hooks/update-check.mjs`)이 들어갑니다. 새로 시작할 때만(`startup`) 돌며, 하루 한 번 원본 저장소의 최신 판을 받아 `~/.goraebap/cache/webcraft-latest.json`에 기억합니다. 설치된 판보다 높으면 `Webcraft 새 판이 나왔습니다(0.8.0 → 0.8.1). 에이전트에게 "Webcraft 업데이트해 줘"라고 하면 갱신합니다.` 한 줄을 보이고, 에이전트가 첫 요청 전에 한 번 갱신을 제안합니다. 동의하면 아래 수동 갱신 명령을 실행한 뒤 `/reload-plugins`를 안내하고, 거절하면 다시 묻지 않습니다. 네트워크 실패나 Node가 없는 경우에는 조용히 넘어갑니다. Codex 배포본에는 훅이 없습니다.

직접 갱신할 때는 다음 명령을 실행하고, Claude Code에서는 `/reload-plugins`를 입력하거나 새 세션을 엽니다.

Claude Code:

```text
claude plugin marketplace update dev-goraebap
claude plugin update webcraft@dev-goraebap
```

Codex:

```text
codex plugin marketplace upgrade dev-goraebap
```

## 설치 이름 맞추기

`goraebap-workflow@goraebap-workflow`가 설치돼 있으면 `webcraft@dev-goraebap`을 설치하고, 설치를 확인한 뒤 사용자가 허용한 범위에서 `goraebap-workflow@goraebap-workflow`를 지웁니다. 입구 스킬 이름은 `goraebap-mode`입니다. 프로젝트 AGENTS.md의 연결은 `webcraft@dev-goraebap`과 설치된 판을 가리키게 고칩니다. 사본에서 바꾼 규칙과 제품 전용 스킬은 보존합니다.

지침 제안은 Webcraft 원본 저장소(`dev-goraebap/dev.goraebap`)의 이슈로 받습니다. 역할별 모델 설정 `~/.claude/rules/goraebap-models.md`는 기존 경로를 유지하며, `~/.goraebap/`에는 최신 판 확인 캐시(`cache/`), 이어받기 문서(`handoff/`), 직접 올리지 못한 이슈 문서(`issues/`)가 남습니다.
