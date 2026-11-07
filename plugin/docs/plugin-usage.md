# goraebap-workflow 플러그인

웹 플랫폼 개발 지침(프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처)입니다. 사용자 범위에 설치하면 에이전트가 작업에 맞는 지침을 스스로 불러 씁니다.

Claude Code:

```text
/plugin marketplace add dev-goraebap/goraebap-workflow --scope user
/plugin install goraebap-workflow@goraebap-workflow --scope user
```

Codex:

```text
codex plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --ref main
codex plugin add goraebap-workflow@goraebap-workflow
```

## 프로젝트에 연결

프로젝트에서 manage-workflow에 연결을 요청합니다. 에이전트가 AGENTS.md에 "개발 지침" 블록(이 플러그인을 따른다는 문장)과 "프로젝트 규칙" 표를 넣습니다. 프로젝트에 지침 사본, 동기화 스크립트, 시작 훅을 만들지 않습니다.

프로젝트만 다르게 하는 결정은 프로젝트 규칙 표에 한 줄씩 적습니다. 에이전트는 지침보다 이 표를 먼저 따릅니다. 다른 프로젝트에도 맞는 규칙은 manage-workflow의 회수로 플러그인 원본 수정을 제안받습니다.

예전 판으로 지침 사본(`.agents/skills/<접두사>-mode` 등)과 동기화 훅을 설치한 프로젝트는 manage-workflow에 사본에서 전환을 요청합니다. 사본에서 고친 부분은 프로젝트 규칙으로 옮기고, 사본·스크립트·훅은 확인을 받은 뒤 지웁니다.

## 갱신

플러그인을 갱신하면 연결된 모든 프로젝트가 새 지침을 따릅니다. 프로젝트 AGENTS.md의 최소 판보다 낮은 플러그인이 설치돼 있으면 먼저 갱신합니다. 커밋·푸시·외부 전송은 이 플러그인 설치만으로 허용되지 않습니다.
