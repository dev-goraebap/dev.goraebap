# goraebap-workflow 로컬 플러그인

웹 플랫폼 개발 지침을 명시적으로 사용하고, 프로젝트에 배포한 지침의 비교·업데이트·개선 회수를 관리합니다. 플러그인은 사용자 범위에 설치하며 설치만으로 프로젝트 규칙에 개입하지 않습니다.

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

Claude의 입구는 `/goraebap-workflow:goraebap-mode`, 관리 기능은 `/goraebap-workflow:manage-workflow`입니다. 분야별 지침은 frontend·backend 같은 이름으로 제공하며 Codex에서는 설치 후 표시되는 명시적 스킬 선택을 사용합니다. 모든 플러그인 스킬은 명시 호출 전용입니다.

새 프로젝트에서는 관리 스킬만 호출하면 온보딩을 시작합니다. 별도의 요청문이나 로컬 원본 경로를 입력할 필요가 없습니다. 현재 프로젝트의 기존 규칙과 사용 에이전트를 확인하고, 판단할 수 없는 선택만 질문합니다. 이미 설치된 프로젝트라면 상태를 안내하며 요청 없이 지침을 업데이트하지 않습니다.

Node 22 이상과 Git이 필요합니다. 아래는 에이전트가 실행하는 명령입니다. PROJECT는 확인한 Git 루트이며 기본 원본은 설치된 플러그인에 포함됩니다. --source는 개발·시험 원본을 따로 지정할 때 사용합니다.

```text
node manager/scripts/workflow.mjs onboard --project PROJECT --agents claude-code,codex
node manager/scripts/workflow.mjs install --project PROJECT
node manager/scripts/workflow.mjs setup-sync --project PROJECT
node manager/scripts/workflow.mjs compare --project PROJECT --source SOURCE
node manager/scripts/workflow.mjs update --project PROJECT
node manager/scripts/workflow.mjs update --project PROJECT --apply
node manager/scripts/workflow.mjs adopt --project PROJECT --source KNOWN_BASELINE
```

프로젝트는 .agents/skills만 원본으로 관리합니다. 독립 scripts/sync-skills.mjs와 선택한 에이전트의 SessionStart 훅을 공유하고, .claude/skills·.grok/skills는 gitignore로 제외합니다. Codex는 원본을 직접 읽습니다. 기존 스킬·훅·다른 동기화 도구·사본의 직접 수정을 자동 덮어쓰지 않습니다.

팀원은 개인 플러그인 없이 프로젝트의 `node scripts/sync-skills.mjs`로 모든 프로젝트 스킬을 동기화할 수 있습니다. 에이전트별 훅의 신뢰 승인은 각 사용자가 진행합니다. 시작 훅은 네트워크나 공통 원본 업데이트를 실행하지 않습니다.

관리 기준·분류·개선 제안은 Git이 알려주는 로컬 관리 경로에만 저장하고 프로젝트의 공유 파일에는 넣지 않습니다. clone에 따라오지 않으므로 새 관리자는 실제 채택했던 원본으로 adopt를 진행합니다. 프로젝트의 현재 수정본을 과거 원본이라고 추정하지 않습니다.

플러그인 갱신과 프로젝트 원본 업데이트는 별개이며 프로젝트 업데이트는 기본 수동입니다. 충돌 시 적용하지 않습니다. 커밋·푸시·외부 전송·원본 자동 수정은 이 플러그인 설치만으로 허용되지 않습니다.
