# 운영 절차

## 사용자 범위 플러그인

```text
claude plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --scope user
claude plugin install goraebap-workflow@goraebap-workflow --scope user
codex plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --ref main
codex plugin add goraebap-workflow@goraebap-workflow
```

플러그인은 개인 관리 도구다. 팀원이 프로젝트 스킬을 사용하는 데 설치할 필요는 없다. 프로젝트 스킬 배포와 개인 플러그인 설치를 구분한다.

## 명령

사용자는 관리 스킬 호출만으로 시작한다. 아래 명령은 에이전트가 실행하며 사용자에게 복사·입력을 요구하지 않는다. CLI는 이 스킬의 위치에서 찾은 절대 경로, PROJECT는 확인한 Git 루트다. 기본 원본은 플러그인의 project-source이며 개발 체크아웃에서는 이 저장소다. 경로와 이유는 셸에서 한 인자로 인용한다.

```text
node <CLI> onboard --project PROJECT --agents claude-code,codex
node <CLI> install --project PROJECT
node <CLI> install --project PROJECT --source SOURCE --prefix myapp --agents claude-code,codex
node <CLI> setup-sync --project PROJECT
node <CLI> setup-sync --project PROJECT --agents grok
node <CLI> sync --project PROJECT
node <CLI> sync --project PROJECT --agents claude-code --check
node <CLI> compare --project PROJECT --source SOURCE --file backend/SKILL.md
node <CLI> update --project PROJECT
node <CLI> update --project PROJECT --apply
node <CLI> classify --project PROJECT --file backend/SKILL.md --kind upstream --reason "공통 개선의 근거"
node <CLI> propose --project PROJECT --name batch-query
node <CLI> adopt --project PROJECT --source KNOWN_BASELINE
```

onboard는 설치 상태를 먼저 판별한다. 신규 프로젝트는 확인한 에이전트만 설정하고 새 AGENTS.md를 만든다. 기존 AGENTS.md는 변경하지 않고 에이전트가 통합할 내용을 반환한다. 기존 관리 기준이 있으면 읽기 전용 상태 조회로 끝내며 플러그인 갱신을 프로젝트 갱신으로 연결하지 않는다. 별도 원본 시험에는 --source를 사용한다. compare의 --source 생략은 로컬 기준과의 오프라인 비교이며, 새 설치본과의 비교는 CLI가 있는 플러그인의 project-source를 명시한다.

project-source에는 관리 스킬과 플러그인의 호출 제한을 넣지 않는다. 같은 개발 원본에서 생성한 배포 스냅샷으로, 직접 호출용 manager/skills와 용도가 다르다. 설치에 원본 저장소 체크아웃이 필요하지 않다. adopt만은 과거 기준을 복구하는 작업이므로 알려진 원본의 명시 지정을 유지한다.

## 프로젝트 구성

기본 프로젝트 입구는 development, 분야별 지침은 frontend·backend다. --prefix myapp이면 입구는 myapp-mode, 나머지는 myapp-frontend 같은 이름으로 바뀐다. 스킬 메타데이터와 상대 링크만 바꾸고 코드 식별자·API 경로는 유지한다.

install은 스킬·독립 동기화 스크립트·시작 훅·gitignore를 준비한다. setup-sync는 기존 스킬을 유지하고 동기화만 준비한다. AGENTS.md에는 프로젝트 입구와 원본/사본 정책만 연결한다. 개인 플러그인 사용법이나 원본 버전 관리 절차를 팀의 필수 지침으로 넣지 않는다.

공유하는 파일은 .agents/skills, scripts/sync-skills.mjs, 선택한 에이전트의 시작 훅 설정, .gitignore다. Claude는 .claude/settings.json, Codex는 .codex/hooks.json, Grok Build는 .grok/hooks/skill-sync.json에 SessionStart를 추가한다. 기존 설정을 보존하고 반복 실행 시 같은 훅을 중복 추가하지 않는다.

사본은 .claude/skills·.grok/skills에 생성하고 Git에서 제외한다. Codex는 원본을 직접 읽는다. 설정 폴더 전체는 제외하지 않는다. 다른 에이전트는 실제 skills 경로와 훅 형식을 확인한 뒤 지원을 추가한다.

## 독립 동기화

프로젝트 팀원은 플러그인 없이 다음 명령을 사용한다.

```text
node scripts/sync-skills.mjs
node scripts/sync-skills.mjs --agent claude-code
node scripts/sync-skills.mjs --agent grok --check
```

모든 .agents/skills 원본의 SKILL.md·참고 자료·바이너리 자산을 복사한다. 원본과 사본의 링크 경로는 자동으로 따라가지 않으며, 수정된 사본·소유가 다른 파일·추적 중인 사본은 거절한다. 소유 기록에 있는 삭제 파일만 지우고 모르는 파일은 보존한다. 원본 디렉터리 전체가 사라지면 사본을 일괄 삭제하지 않는다.

훅은 Git 루트에서 스크립트를 찾아 실행하므로 하위 폴더에서 시작할 수 있다. Claude 시작 훅은 복사 후 reloadSkills를 반환해 같은 세션에서 새 스킬을 재검색하게 한다. 시작 훅은 세션에서 신뢰·허용되어야 하며 모든 클라우드 실행 환경이 같은 훅을 지원한다고 가정하지 않는다. 설정 생성이나 셸에서 명령을 실행한 결과를 에이전트 세션에서 실행된 결과로 보고하지 않는다.

사본 해시·설정 도구 소유 기록·실행 lock은 Git 관리 경로의 skill-sync 아래에 둔다. 에이전트별 lock으로 동시 실행을 방지하고, 강제 종료 후 lock은 실행 상태를 확인한 뒤 정리한다. 복사는 전원 중단까지 보장하는 트랜잭션이 아니므로 실패 메시지를 무시하거나 실패를 성공으로 기록하지 않는다.

## 개인 관리 기준

원본 버전·digest·이름 대응·기준 본문·변경 분류·개선 제안은 Git 관리 경로의 goraebap-workflow 아래에 저장한다. 일반 저장소의 .git과 linked worktree의 Git 관리 경로를 구분한다. source의 로컬 절대 경로는 기준에 저장하지 않는다.

이 정보는 clone에 따라오지 않는다. 새 관리자는 실제 채택했던 원본을 확인해 adopt --source로 기준을 등록한다. adopt는 프로젝트 파일을 변경하지 않는다. 기준이 없으면 원본 업데이트를 추정해서 실행하지 않는다. 예전 .workflow 기록은 보존하고 확인 후 별도로 정리한다.

update는 기준·프로젝트·새 원본의 세 버전을 비교한다. --apply 없이 미리보기하고 충돌 시 모든 적용을 중단한다. 실제 적용은 파일을 쓴 뒤 로컬 기준을 갱신하므로 변경 전 상태와 적용 후 diff를 확인한다. 동시 관리 명령을 실행하지 않는다.

project는 프로젝트 합의, upstream은 공통 개선 후보, trial은 시험 중인 변경이다. 분류 후 파일이 바뀌면 다시 분류한다. 제안은 로컬 Git 경로에 초안으로만 만들고 외부 전송·원본 자동 수정·PR 생성을 하지 않는다. 로컬 저장은 권한 통제가 아니며 팀의 Git 리뷰·병합 정책은 유지한다.
