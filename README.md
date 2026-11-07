# goraebap-workflow

웹 플랫폼 개발 지침을 프로젝트에 배포하고, 프로젝트별 개선을 공통 원본과 비교·회수하는 개인 플러그인입니다.

## 두 가지 사용 방식

- 로컬 플러그인은 사용자 범위에 설치하고 명시적으로 호출합니다. 설치만으로 프로젝트 규칙에 개입하지 않습니다.
- 프로젝트에 배포한 스킬은 프로젝트의 규칙입니다. 팀원은 플러그인을 설치하지 않아도 스킬을 사용하고 사본을 동기화할 수 있습니다.

## 저장소 구성

```text
skills/                         공통 개발 지침 원본
  goraebap-mode/                개발 작업 입구·플레이북
  frontend/                     Storybook · 부품 · 패턴 · 화면 예제
  backend/                      Spring·jOOQ·모듈 경계
  api/                          HTTP·오류·권한·생성 타입
  database/                     마이그레이션
  design-system/                Astryx·Solar·테마·레이아웃과 선택형 코드 레퍼런스
  architecture/                 시스템 경계·운영
manager/skills/manage-workflow/  설치·비교·업데이트 관리 지침
manager/scripts/                관리 CLI와 설정 도구
manager/templates/              프로젝트에 배포할 독립 동기화 스크립트
scripts/                        검사·패키지 생성
tests/                          임시 Git 저장소·clone·worktree 검증
dist/                           Git으로 함께 배포하는 생성 플러그인
```

## 사용자 범위 플러그인 설치

프론트엔드는 상태·코드 구조, 디자인 시스템은 화면 표현, 백엔드는 도메인·서비스, DB는 스키마·마이그레이션을 소유합니다. 함께 적용할 수 있지만 규칙 본문은 책임 영역 한 곳에 둡니다. 화면 레퍼런스는 프로젝트가 디자인을 정하지 않았을 때 검토하는 선택형 판본입니다. 스킬 설치만으로 제품 소스에 UI를 추가하지 않으며 프로젝트의 기존 디자인을 우선합니다.

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

다른 범위를 요청한 경우에만 그 범위를 사용합니다. Claude의 개발 입구는 `/goraebap-workflow:goraebap-mode`, 관리 입구는 `/goraebap-workflow:manage-workflow`입니다. Codex에서는 설치 후 표시되는 명시적 스킬 선택을 사용합니다. 모든 패키지 스킬은 Claude의 `disable-model-invocation: true`와 Codex의 `policy.allow_implicit_invocation: false`를 생성합니다.

## 프로젝트에 배포

새 프로젝트에서 관리 스킬만 호출하면 에이전트가 온보딩을 시작합니다. 설치된 플러그인이 기본 원본이므로 별도 요청문·원본 경로·체크아웃이 필요하지 않습니다. 사용 에이전트는 대화와 프로젝트 설정에서 확인하고 불명확할 때만 질문합니다. 이미 설치된 프로젝트는 상태를 안내하며 자동 갱신하지 않습니다.

Node 22 이상과 Git이 필요합니다. 아래는 에이전트가 실행하는 CLI 예시입니다. 개발 체크아웃에서는 이 저장소가 기본 원본이고, 플러그인에서는 포함된 project-source가 기본입니다. --source는 개발·시험용 선택 옵션입니다.

```text
npm run workflow -- onboard --project PROJECT --agents claude-code,codex
```

온보딩은 프로젝트 이름·약어를 접두사로 사용합니다. 예를 들어 myapp은 `myapp-mode`, `myapp-frontend`, `myapp-backend`로 설치합니다. 이름은 대화와 프로젝트 설정에서 확인하며 --prefix로 명시할 수 있습니다. 플러그인의 개인 이름을 프로젝트에 강제하지 않습니다. 이름 변환은 메타데이터와 스킬 상대 링크에만 적용합니다.

install은 스킬 배포와 함께 독립 동기화 스크립트·시작 훅·gitignore를 준비합니다. 기존 스킬과 다른 사람이 만든 동기화 스크립트를 덮어쓰지 않습니다. 기존 훅·권한·설정은 보존합니다. Git에서 추적 중인 사본은 자동 추적 해제하지 않고 원본 대조를 먼저 요구합니다.

프로젝트 AGENTS.md에는 다음처럼 일반적인 정책만 연결합니다. onboard는 파일이 없을 때 생성하고, 기존 파일은 에이전트가 읽어 입구와 충돌 없이 통합합니다. 저수준 install은 AGENTS.md를 수정하지 않습니다.

```markdown
개발 작업은 .agents/skills/myapp-mode/SKILL.md에서 시작한다.
스킬의 원본은 .agents/skills다. 에이전트별 skills 폴더는 생성 사본이다.
사본은 직접 수정하지 않고 node scripts/sync-skills.mjs로 동기화한다.
```

### 팀과 공유하는 파일

```text
.agents/skills/                 유일한 스킬 원본, Git 관리
scripts/sync-skills.mjs          Node 내장 모듈과 Git만 쓰는 독립 도구
.claude/settings.json            Claude SessionStart 훅
.codex/hooks.json                Codex SessionStart 훅
.grok/hooks/skill-sync.json       Grok Build SessionStart 훅
.gitignore                      에이전트별 skills 폴더만 제외
```

Claude·Grok은 각각 `.claude/skills`·`.grok/skills`에 복사하고 Codex는 `.agents/skills`를 직접 읽습니다. Claude 시작 훅은 복사 후 reloadSkills로 같은 세션의 스킬 재검색을 요청합니다. 에이전트 설정 폴더 전체를 제외하지 않습니다. 훅 설정은 팀이 공유하지만 실행 신뢰 승인은 각 사용자가 진행합니다. 훅을 지원하지 않거나 제한하는 실행 환경에서는 독립 명령을 사용합니다.

### 로컬에만 있는 정보

```text
Git이 알려주는 로컬 관리 디렉터리/
  skill-sync/                   사본 해시·실행 lock·설정 도구 소유 정보
  goraebap-workflow/             관리 플러그인을 사용하는 사람의 정보
    lock.json                   원본 버전·digest·이름 대응·기준 본문
    decisions.json              변경 목적지·이유·분류한 내용 해시
    proposals/                  로컬 개선 제안
```

일반 저장소에서는 `.git/` 아래입니다. linked worktree에서는 Git의 실제 worktree 관리 경로를 사용하며 다른 checkout과 상태를 섞지 않습니다. 프로젝트에 `.workflow/`나 플러그인 설치 안내를 생성하지 않습니다. 사본과 관리 정보는 commit되지 않습니다.

## 동기화 설정과 실행

기존 프로젝트의 스킬을 그대로 두고 동기화 기능만 도입할 수도 있습니다. 이 작업에는 공통 원본 비교 기준이 필요하지 않습니다.

```text
npm run workflow -- setup-sync --project PROJECT
npm run workflow -- setup-sync --project PROJECT --agents claude-code,codex
```

setup-sync를 한 번 진행한 프로젝트에서는 누구나 다음 명령을 사용할 수 있습니다.

```text
node scripts/sync-skills.mjs
node scripts/sync-skills.mjs --agent claude-code
node scripts/sync-skills.mjs --agent grok --check
```

고래밥 스킬뿐 아니라 SKILL.md가 있는 프로젝트의 모든 스킬과 첨부 파일을 동기화합니다. 기본 대상은 gitignore로 제외한 지원 에이전트의 사본 폴더이며 --agent로 좁힐 수 있습니다. 네트워크 접근·공통 원본 업데이트·개인 플러그인 실행은 하지 않습니다. 사본의 직접 수정과 다른 소유자의 파일을 발견하면 덮어쓰지 않습니다. 원본 삭제 시 마지막 동기화에서 소유한 파일만 정리하고 모르는 파일은 보존합니다. 원본 폴더 자체가 없으면 삭제를 중단합니다.

새 clone에도 스크립트와 훅 설정은 따라옵니다. 훅을 신뢰한 뒤 시작하면 사본이 생성됩니다. 사본 해시와 실행 lock은 checkout마다 로컬에서 다시 생성합니다. 동시 시작 훅은 에이전트별 lock으로 보호합니다. 강제 종료 후 남은 lock은 실행 상태를 확인한 뒤 정리합니다.

## 관리자의 원본 비교·업데이트·개선 회수

```text
npm run workflow -- compare --project PROJECT
npm run workflow -- compare --project PROJECT --source . --file backend/SKILL.md
npm run workflow -- update --project PROJECT --source .
npm run workflow -- update --project PROJECT --source . --apply
npm run workflow -- classify --project PROJECT --file backend/SKILL.md --kind upstream --reason "공통 개선 근거"
npm run workflow -- propose --project PROJECT --name batch-query
```

update는 기준·프로젝트·새 원본을 비교하고 텍스트를 세 버전 병합합니다. 충돌이 하나라도 있으면 스킬과 기준을 변경하지 않습니다. --apply가 없으면 미리보기입니다. 적용 후 규칙의 의미·호환성과 프로젝트 검사를 확인합니다. 원본 업데이트는 기본 수동이며 시작 훅과 플러그인 갱신이 대신 실행하지 않습니다.

분류는 project(팀의 선택), upstream(공통 개선 후보), trial(시험 중)입니다. 제안은 현재 upstream으로 분류된 파일만 로컬 Git 경로에 생성합니다. 회사 정보·프로젝트 전용 내용·전체 파일 본문을 검토한 뒤 공통 원본에 별도로 반영합니다. 외부 전송과 원본 자동 수정은 하지 않습니다.

관리 정보는 clone에 따라오지 않습니다. 새 컴퓨터·새 관리자는 채택했던 원본을 별도 체크아웃하고 명시적으로 등록합니다.

```text
npm run workflow -- adopt --project PROJECT --source KNOWN_BASELINE
```

adopt는 주어진 원본을 기준으로 등록하고 차이를 보여 주며 프로젝트 스킬을 덮어쓰지 않습니다. 현재 수정본이나 최신 원본을 과거의 기준이라고 추정하지 않습니다. 예전 `.workflow` 기록이 있는 프로젝트는 그 파일을 보존하고 실제 기준을 확인한 뒤 등록합니다. 자동 이관·삭제는 하지 않습니다.

적용은 전원 중단까지 보장하는 트랜잭션이 아닙니다. 변경 전 상태와 적용 후 diff를 확인합니다. 로컬 메타데이터는 접근 권한 장치가 아니며 스킬 수정·리뷰 권한은 프로젝트의 Git 정책이 정합니다.

## 개발과 배포

```text
npm run check
npm test
npm run package:plugins
claude plugin validate .
```

생성 패키지는 허용한 개발 지침·관리 기능·독립 동기화 템플릿·사용 안내만 담습니다. 로컬 참고 자료는 Git과 배포에서 제외합니다. 패키지를 다시 생성하면 설치된 플러그인의 갱신은 별도로 필요합니다. 패키지·훅 명령 검증과 실제 에이전트 세션에서 훅이 승인·실행된 상태는 구분합니다.

## 화면 패턴 카탈로그

[패턴 지침](skills/design-system/references/pattern-catalog.md)은 생성 양식·공통 다이얼로그·Split·Inset·라우트 마스킹의 사용 기준을 코드와 실행 견본에 연결합니다. `npm ci` 후 `npm run patterns`로 Storybook(4431)을 엽니다. `npm run patterns:check`는 타입을, `npm run patterns:build`는 정적 내보내기를, `npm run patterns:test`는 Story의 상호작용을 검사합니다. 지침은 Markdown이 원본이고 MDX에서 같은 내용을 가져옵니다. 견본은 선택형 레퍼런스이며 프로젝트에 자동 설치하지 않습니다.

[프론트엔드 카탈로그](frontend/README.md)는 디자인 기초·기본 부품·조합 부품·레이아웃·사용 패턴·화면 예제를 Storybook 하나에서 보여줍니다. 별도 앱 서버는 두지 않습니다. 서가 예제는 같은 부품으로 목록·상세·등록을 연결하며, Story마다 메모리 라우터와 모의 저장소를 새로 만듭니다. 파일 구조는 공식 FSD 지침에 맡기고 자체 검사기는 유지하지 않습니다. `frontend/`는 개발·검토용 소스이며 플러그인 패키지에 자동으로 포함하지 않습니다.
