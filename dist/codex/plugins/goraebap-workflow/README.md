# goraebap-workflow 로컬 플러그인

Claude Code에서 GitHub 마켓플레이스를 등록하고 설치합니다.

```text
/plugin marketplace add dev-goraebap/goraebap-workflow
/plugin install goraebap-workflow@goraebap-workflow
```

Codex에서는 `codex plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --ref main`으로 등록한 뒤 앱에서 설치합니다.

프로젝트가 채택한 개발 지침을 저장소에서 관리하도록 돕습니다. 공통 원본의 스킬을 프로젝트에 설치하고, 원본과 프로젝트의 차이를 비교하고, 새 버전을 검토해 반영하고, 공통으로 가져갈 개선을 로컬 제안으로 만듭니다.

이 플러그인에는 명시 호출용 개발 스킬과 관리 스킬·CLI가 있습니다. 설치만으로 작업에 자동 적용하지 않습니다. 프론트·백엔드 지침을 직접 호출해서 사용할 수 있고, 프로젝트의 규칙으로 채택하려면 별도 goraebap-workflow 원본 체크아웃에서 프로젝트로 배포합니다. 프로젝트 팀원은 플러그인을 설치하지 않아도 저장소에 있는 지침을 사용할 수 있습니다.

Claude에서는 플러그인 이름 아래의 스킬 명령을, Codex에서는 설치 후 표시되는 스킬 선택 메뉴 또는 명시적 스킬 호출을 사용합니다. 모든 패키지 스킬에 Claude의 `disable-model-invocation: true`와 Codex의 `policy.allow_implicit_invocation: false`를 생성합니다. 입구를 호출한 작업에서는 입구가 필요한 지침을 읽습니다.

Claude의 개발 입구는 `/goraebap-workflow:goraebap-mode`, 분야별 지침은 `/goraebap-workflow:frontend`·`/goraebap-workflow:backend`, 관리 기능은 `/goraebap-workflow:manage-workflow`로 호출합니다. 프로젝트로 배포할 때는 플러그인 네임스페이스가 없으므로 필요하면 프로젝트 접두사를 선택합니다.

Node 22 이상이 필요합니다. 텍스트 병합에는 Git이 필요합니다. `manage-workflow` 스킬에 프로젝트와 공통 원본의 경로를 알려 주세요. 일반 제품 구현 요청만으로 관리 작업을 시작하지 않습니다.

실행 예시는 다음과 같습니다. 플러그인의 실제 위치에서 실행하거나 경로를 절대 경로로 바꿉니다.

```text
node manager/scripts/workflow.mjs install --project PROJECT --source SOURCE
node manager/scripts/workflow.mjs compare --project PROJECT --source SOURCE
node manager/scripts/workflow.mjs update --project PROJECT --source SOURCE
node manager/scripts/workflow.mjs update --project PROJECT --source SOURCE --apply
node manager/scripts/workflow.mjs sync --project PROJECT
```

기존 스킬·직접 수정한 Claude 사본은 덮어쓰지 않습니다. 충돌이 있으면 업데이트를 적용하지 않습니다. 커밋·푸시·외부 전송·원본 자동 수정·전역 설정 변경은 수행하지 않습니다. 업데이트 뒤에는 실제 프로젝트의 검사와 바뀐 규칙의 의미를 확인해야 합니다.

플러그인 자체의 업데이트와 프로젝트에 배포한 스킬의 업데이트는 별개입니다. 프로젝트 업데이트는 기본 수동이고, 플러그인 버전이 바뀌어도 프로젝트 지침은 유지됩니다. 현재 자동 업데이트나 주기 실행 기능은 없습니다.
