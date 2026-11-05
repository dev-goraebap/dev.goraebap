# goraebap-workflow

웹 플랫폼을 개발할 때 반복해서 사용하는 작업 방식과, 프로젝트마다 달라진 규칙을 관리하는 도구입니다.

공통 스킬은 프로젝트에 배포합니다. 프로젝트는 그 파일을 직접 고칠 수 있습니다. 관리 도구는 처음 가져온 기준을 보존해 새 원본과 비교하고, 프로젝트에서 발견한 개선을 공통 원본에 제안하도록 돕습니다.

## 구성

```text
skills/                         프로젝트에 배포할 공통 개발 지침
  goraebap-mode/             입구·플레이북·검증
  frontend/             React·TanStack·페이지 우선 FSD
  backend/              Java·Spring·jOOQ·모듈 경계
  api/                  HTTP·오류·권한·생성 타입
  database/             마이그레이션·데이터 이관
  design-system/        Astryx·테마·Solar
  architecture/         경계·외부 연동·운영 판단
manager/skills/manage-workflow/  개인 플러그인으로 제공할 관리 지침
manager/scripts/workflow.mjs    설치·비교·업데이트·분류·제안·동기화 CLI
scripts/                        검사와 두 도구용 패키지 생성
tests/                          임시 프로젝트에서 실행하는 동작 검증
dist/                           생성한 배포용 플러그인, Git에서 함께 관리
```

공통 스킬은 기본 선택입니다. 프로젝트에서 채택한 스택·팀 합의가 다르면 프로젝트의 스킬을 수정하고 그 차이를 유지합니다. 제품의 도메인·서버 주소·포트·계정·실행 명령은 공통 규칙에 고정하지 않습니다.

## 프로젝트에 설치

Node 22 이상이 필요하며, 양쪽에서 수정한 텍스트를 병합하려면 Git이 필요합니다. 외부 npm 의존성은 없습니다. 아래 명령은 이 저장소 루트에서 실행합니다. 대상 프로젝트 폴더는 먼저 존재해야 합니다.

```powershell
npm run workflow -- install --project "C:/work/myapp"
npm run workflow -- sync --project "C:/work/myapp"
```

입구는 `goraebap-mode`, 분야별 지침은 `frontend`, `backend`, `api`처럼 짧은 이름을 씁니다. 프로젝트 이름을 쓰려면 최초 설치에 `--prefix myapp`을 줍니다. 입구는 `myapp-mode`, 프론트 지침은 `myapp-frontend`가 되고 메타데이터와 지침 링크도 함께 바뀝니다. API 경로나 코드의 api 세그먼트는 바꾸지 않습니다.

```powershell
npm run workflow -- install --project "C:/work/myapp" --prefix myapp
```

설치 결과:

```text
myapp/
  .agents/skills/                프로젝트가 소유하고 고치는 원본
  .claude/skills/                sync로 생성하는 사본
  .workflow/
    lock.json                   채택한 원본 식별자·버전·digest·이름 대응·기준 본문
    mirrors.json                관리 사본의 마지막 생성 내용 해시
    decisions.json              변경의 목적지·이유·분류 당시 해시
    proposals/                  공통 원본에 보낼 로컬 초안
```

이 도구는 기존 AGENTS.md를 자동 수정하지 않습니다. 프로젝트의 기존 규칙과 충돌하지 않게 다음 내용을 연결합니다. prefix를 썼다면 입구 경로도 바꿉니다.

```markdown
개발 변경은 `.agents/skills/goraebap-mode/SKILL.md`를 입구로 삼는다.
프로젝트 규칙은 `.agents/skills`에서 고친다. `.claude/skills`는 동기화 사본이다.
채택한 공통 기준은 `.workflow/lock.json`에 있다.
```

프로젝트 원본과 lock, 분류 기록, AGENTS.md를 Git에 둡니다. 팀은 Claude 사본도 커밋하거나 프로젝트 자체의 설치/CI 과정에서 생성하는 방식 중 하나를 채택합니다. CLI는 다른 도구의 설정·스킬·앱 코드를 자동 변경하지 않습니다.

## 수정·분류·회수

프로젝트 작업 중에는 `.agents/skills`를 직접 고칩니다. 목적지가 분명해지면 파일 단위로 분류합니다.

```powershell
npm run workflow -- compare --project "C:/work/myapp"
npm run workflow -- classify --project "C:/work/myapp" --file backend/SKILL.md --kind upstream --reason "여러 프로젝트에서 필요한 일괄 조회 원칙"
npm run workflow -- propose --project "C:/work/myapp" --name batch-query
npm run workflow -- sync --project "C:/work/myapp"
```

`project`는 이 프로젝트의 합의, `upstream`은 공통 개선 후보, `trial`은 시험 중인 변경입니다. 분류 뒤 파일이 다시 바뀌면 다시 분류해야 합니다. 제안은 upstream 파일만 포함하며 `.workflow/proposals`에 로컬로 생성합니다.

제안에는 기준과 현재 파일의 전체 본문이 포함될 수 있습니다. 회사 정보·제품 전용 내용·이름 변환을 검토한 뒤 재사용할 규칙만 공통 원본에 옮깁니다. 도구는 제안을 외부로 보내거나 원본에 자동 적용하지 않습니다.

## 새 공통 원본 반영

원본 저장소의 태그·커밋을 원하는 버전으로 체크아웃한 뒤 실행합니다. 버전 문자열 외에 파일 내용의 digest로 실제 차이를 구분합니다. lock에는 사용자 컴퓨터의 절대 경로를 기록하지 않습니다.

```powershell
npm run workflow -- compare --project "C:/work/myapp" --source .
npm run workflow -- compare --project "C:/work/myapp" --source . --file backend/SKILL.md
npm run workflow -- update --project "C:/work/myapp" --source .
npm run workflow -- update --project "C:/work/myapp" --source . --apply
npm run workflow -- sync --project "C:/work/myapp"
npm run workflow -- sync --project "C:/work/myapp" --check
```

처음 가져온 기준·프로젝트·새 원본을 비교합니다. 충돌이 하나라도 있으면 스킬과 lock을 바꾸지 않습니다. compare의 --file로 세 버전을 확인할 수 있습니다. 텍스트 병합이 성공해도 규칙의 의미·프로젝트 예외를 검토하고 프로젝트 검사를 실행합니다.

적용 도중 프로세스 종료까지 보장하는 파일시스템 트랜잭션은 아닙니다. 적용 전 Git 상태를 확인하고 적용 후 diff를 검토합니다. 같은 프로젝트에서 관리 명령을 동시에 실행하지 않습니다.

## Claude·Codex 플러그인

GitHub 저장소의 `main`에서 설치할 수 있습니다.

Claude Code:

```text
/plugin marketplace add dev-goraebap/goraebap-workflow
/plugin install goraebap-workflow@goraebap-workflow
```

Codex:

```text
codex plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --ref main
```

Codex에서는 마켓플레이스를 등록한 뒤 앱의 플러그인 화면에서 설치합니다. 로컬 플러그인의 갱신과 프로젝트 스킬 업데이트는 별개입니다.

개발 스킬과 관리 기능을 두 도구용 로컬 패키지로 생성합니다. 모든 플러그인 스킬은 명시적으로 호출해야 적용됩니다. 두 패키지의 본문·실행 코드는 같은 원본을 사용합니다.

| 사용 방식 | 호출과 적용 |
| --- | --- |
| 로컬 플러그인에서 직접 사용 | 명시 호출만. 설치만으로 다른 프로젝트에 개인 규칙을 적용하지 않음 |
| 프로젝트로 배포한 스킬 | 프로젝트 AGENTS.md·팀 정책에 따라 적용. 플러그인 설치는 필수가 아님 |

패키징 때 Claude에는 `disable-model-invocation: true`, Codex에는 `agents/openai.yaml`의 `policy.allow_implicit_invocation: false`를 생성합니다. 프로젝트 배포용 원본에는 이 명시 호출 제한을 붙이지 않습니다.

Claude의 플러그인 명령은 다음처럼 표시됩니다. Codex에서는 설치 후 표시되는 명시적 스킬 선택을 사용합니다.

```text
/goraebap-workflow:goraebap-mode       개발 작업 입구
/goraebap-workflow:frontend           프론트 지침 직접 사용
/goraebap-workflow:backend            백엔드 지침 직접 사용
/goraebap-workflow:manage-workflow    프로젝트 설치·비교·업데이트
```

```powershell
npm run package:plugins
```

Claude Code에서 생성한 로컬 마켓플레이스를 등록하고 설치합니다. 아래는 실행 예시이며 이 저장소 생성만으로 설치되지는 않습니다.

```text
/plugin marketplace add C:/path/to/goraebap-workflow/dist/claude
/plugin install goraebap-workflow@goraebap-workflow
```

Codex에서는 지원하는 CLI로 로컬 마켓플레이스를 등록한 뒤 앱의 플러그인 화면에서 설치합니다.

```text
codex plugin marketplace add C:/path/to/goraebap-workflow/dist/codex
```

플러그인에서 install·update할 때는 `--source`에 공통 원본 체크아웃을 명시합니다. 프로젝트 팀원 모두에게 관리 플러그인을 설치할 필요는 없습니다. 저장소에 배포된 스킬을 읽는 데는 플러그인이 필요하지 않습니다.

패키지는 개발 스킬·관리 스킬·관리 스크립트·사용 안내·매니페스트만 허용 목록으로 복사합니다. 개발용 로컬 메모, 테스트, 프로젝트 데이터는 포함하지 않습니다. 패키지를 다시 만들면 도구별 설치 사본의 갱신·재시작은 별도로 필요할 수 있습니다.

플러그인 자체의 업데이트 설정과 프로젝트 업데이트는 별개입니다. 플러그인을 갱신해도 프로젝트 파일은 바꾸지 않습니다. 프로젝트 업데이트는 기본 수동이고, 현재 자동 실행 기능은 없습니다. 향후 프로젝트별 자동 업데이트를 추가하더라도 본인 또는 팀의 opt-in, 로컬 변경 보존, 충돌·검증 실패 시 중단이 필요합니다.

## 기존 프로젝트 도입

기존 스킬이 있는 프로젝트에는 install로 덮어쓰지 않습니다. 기존 지침과 공통 원본의 차이를 검토해 기준과 이름 대응을 정하는 이관이 먼저입니다. 현재 CLI에는 기존 스킬 채택 명령, 스킬 묶음 추가·제거, 원격 다운로드, 자동 PR 생성이 없습니다.

## 개발 확인

```powershell
npm test
npm run check
npm run package:plugins
claude plugin validate ./dist/claude/plugins/goraebap-workflow
claude plugin validate ./dist/claude
```

테스트는 임시 프로젝트에서 설치, 이름 변환, 로컬 변경 보존, 세 버전 병합, 충돌 시 미적용, 사본 보호, 제안 분류, 경로와 링크 차단, 배포 파일 범위를 확인합니다. 도구별 실제 설치·세션 활성화와 매니페스트 검증은 별개입니다. 공개 디렉터리 게시에 필요한 라이선스·아이콘 등의 설정은 로컬 패키지 생성에 포함하지 않습니다.
