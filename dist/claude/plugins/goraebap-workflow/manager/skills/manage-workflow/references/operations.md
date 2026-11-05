# 운영 절차

아래 CLI 경로는 실제 설치된 이 스킬에서 찾은 절대 경로로 바꾼다. `PROJECT`, `SOURCE`는 사용자의 프로젝트와 공통 원본 체크아웃이다. 쉘에서 각 경로와 이유를 하나의 인자로 인용한다.

```text
node <CLI> install --project PROJECT --source SOURCE
node <CLI> install --project PROJECT --source SOURCE --prefix myapp
node <CLI> compare --project PROJECT
node <CLI> compare --project PROJECT --source SOURCE
node <CLI> update --project PROJECT --source SOURCE
node <CLI> update --project PROJECT --source SOURCE --apply
node <CLI> sync --project PROJECT
node <CLI> sync --project PROJECT --check
node <CLI> classify --project PROJECT --file backend/SKILL.md --kind upstream --reason "다른 프로젝트에도 필요한 개선"
node <CLI> propose --project PROJECT --name batch-query-guidance
```

## 설치와 팀 공유

기본 입구는 `goraebap-mode`, 분야별 지침은 `frontend`·`backend` 같은 짧은 이름으로 설치한다. --prefix myapp이면 입구는 `myapp-mode`, 프론트 지침은 `myapp-frontend`가 된다. 스킬 메타데이터와 다른 스킬을 가리키는 상대 링크도 함께 바꾸고, API 경로나 일반 코드 식별자는 유지한다. 복잡한 임의 이름 대응은 지원하지 않는다.

설치 후 프로젝트 AGENTS.md에 입구 스킬과 원본/사본 정책을 사람이 검토할 수 있게 추가한다. 프로젝트의 기존 정책을 유지하고 중복 입구를 만들지 않는다. 예시:

```markdown
개발 변경은 `.agents/skills/goraebap-mode/SKILL.md`를 입구로 삼는다.
프로젝트 규칙은 `.agents/skills`에서 고친다. `.claude/skills`는 동기화 사본이다.
공통 원본에서 채택한 기준은 `.workflow/lock.json`에 있다.
```

스킬 원본, `.workflow/lock.json`, 분류 기록, 프로젝트 AGENTS.md와 팀이 채택한 사본/동기화 수단을 버전 관리한다. 플러그인은 개발 지침을 읽는 데 필수가 아니며 관리 담당자가 설치하면 된다. 동료는 공통 원본 체크아웃 없이 프로젝트 지침을 사용할 수 있다.

## 로컬 호출과 프로젝트 적용

패키지 안의 모든 스킬은 Claude의 disable-model-invocation과 Codex의 allow_implicit_invocation 설정으로 자동 선택을 끈다. 로컬 플러그인의 입구를 호출하면 그 작업에 필요한 지침을 읽을 수 있지만 다른 작업으로 개인 규칙을 확장하지 않는다. 프로젝트에 install한 스킬은 이 패키징 설정을 붙이지 않고, 프로젝트 AGENTS.md의 연결과 팀 정책에 따라 사용한다.

플러그인 배포 버전과 프로젝트 lock은 별개다. 로컬 플러그인 업데이트가 프로젝트 스킬을 바꾸지 않는다. 프로젝트는 관리 명령으로 업데이트할 때만 기준을 옮긴다. 자동 업데이트는 현재 지원하지 않으며, 향후 도입 시 프로젝트별 opt-in·로컬 변경 보존·충돌 시 미적용·검증 실패 시 중단을 별도로 구현해야 한다.

## 비교와 업데이트

lock은 배포 당시 이름으로 변환된 파일 본문과 해시를 보존한다. 로컬 경로나 브랜치의 최신 상태에 의존하지 않고 기준을 재현한다. source를 주면 기준·프로젝트·새 원본을 비교한다. 버전 문자열이 같아도 digest가 다르면 다른 원본이다.

update는 파일 단위 세 버전 비교 후, 양쪽에서 바뀐 텍스트를 git merge-file로 병합한다. 추가/삭제 충돌이나 텍스트 충돌은 전체 적용을 중단한다. 충돌 파일을 compare 목록과 lock의 base, 새 원본에서 읽고 프로젝트 파일을 해결한 뒤 다시 실행한다. 충돌 표시를 제품 스킬에 쓰거나 force 옵션으로 덮어쓰지 않는다.

--apply가 없으면 미리보기다. 적용은 파일 쓰기 후 lock을 갱신한다. 전원 중단까지 보장하는 트랜잭션은 아니므로 적용 전 프로젝트 변경을 보존하고 적용 후 Git diff를 확인한다. 동시 관리 명령은 실행하지 않는다. 새 스킬 선택·기존 프로젝트 채택·패키지/스킬 전체 삭제는 이 버전에 없다.

## 분류와 개선 회수

- project: 팀의 선택·프로젝트 제약으로 남길 차이.
- upstream: 공통 원본에서 검토할 개선.
- trial: 아직 일반화 여부를 정하지 못한 시도.

classify는 파일별 현재 내용 해시와 이유를 남긴다. propose는 upstream 파일만 `.workflow/proposals/<name>.json`에 만든다. 분류 뒤 바뀐 내용은 자동 포함하지 않는다. 초안은 자동으로 외부 전송하거나 공통 원본에 적용하지 않는다. 필요 없는 회사 정보가 없는지 검토하고 재사용할 규칙만 공통 원본에 반영한다.
