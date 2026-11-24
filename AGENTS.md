# dev-goraebap

웹 앱 개발 지침 플러그인 **Webapp**(`webapp@dev-goraebap`)을 관리합니다. 지침과 문서는 한국어로 씁니다. Git으로 관리하지 않는 임시 문서는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽으며, 지침의 원본은 이 파일 하나입니다.

## 원본과 작업 범위

- `plugins/webapp/skills/`는 배포할 핵심 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 핵심 지침(`skills/`, `examples/` 제외)은 스택·라이브러리·예시 프로젝트 이름 없이 판단 기준과 이유만 쓰며 `plugins/webapp/`의 `npm run check`가 이를 검사합니다.
- 스택별 구현 예시는 각 스킬 폴더의 `examples/<주제>.md`에 두고, 새 예시를 더하거나 고치는 법은 [예시 읽기](plugins/webapp/skills/goraebap-mode/references/examples.md)를 따릅니다. 예시는 공개 오픈소스 프로젝트에서만 발췌하며, 저장소 서브모듈 없이 원본 저장소의 고정 커밋 주소(`https://github.com/<owner>/<repo>/blob/<40자리 커밋>/...`)로 링크합니다. 링크가 살아 있는지 확인할 때는 `plugins/webapp/`에서 `npm run check:links`를 실행합니다. 이 방식을 고른 이유는 [결정 기록](docs/decisions.md)에 둡니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webapp을 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 되돌리기 어려운 결정과 기각한 대안은 [결정 기록](docs/decisions.md)에 남깁니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webapp/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webapp/skills/goraebap-mode/references/writer.md)를 따릅니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다(글쓰기 기준).

`plugins/webapp/dist/`는 직접 고치지 않고 `plugins/webapp/`에서 `npm run package`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webapp`입니다.

## 지침 사이트

`web/apps/devgoraebap`은 지침을 사람이 읽는 글로 옮긴 사이트(dev.goraebap.xyz)입니다. 공간은 playbook·frontend·backend입니다. frontend·backend의 내용 스킬 이름은 메뉴를 따르고(`frontend-engineering`, `frontend-design-system`, `frontend-interaction`, `backend-engineering`), playbook 공간의 플레이북은 goraebap-mode의 플레이북 파일과 1:1입니다. `webapp-project`는 플레이북이 조합하는 재료로만 보입니다. 규칙의 원본은 스킬이고 사이트는 같은 규칙을 다이어그램·표·1인칭 글로 풉니다. 사이트에서 먼저 새 규칙을 만들지 않습니다.

- 스킬을 고치면 그 파일을 `skills` 값으로 가리키는 사이트 문서(`src/entities/webapp-doc/model/catalog.ts`)도 같은 변경에서 맞춥니다. goraebap-mode 플레이북을 더하거나 고치면 `src/entities/playbook/model/playbooks.ts`의 같은 플레이북과 단계·스킬 조합도 맞춥니다.
- 문서를 더하거나 주소를 옮기면 메뉴·검색 목록(`src/widgets/doc-search/model/search-index.ts`)과 예전 주소 돌려보내기(`src/pages/__root.tsx`)를 함께 고칩니다. 공간이나 메뉴가 바뀌면 워크스페이스 전환(`WorkspaceSwitcher`)·푸터(`SiteFooter`)·랜딩도 봅니다.
- 사이트를 바꾼 뒤 `web/apps/devgoraebap`에서 `pnpm typecheck`와 `pnpm check:skills`를 실행합니다.
- 배포는 사용자가 요청할 때 저장소 루트에서 `deploy/devgoraebap.sh`로 합니다.

## 검증과 배포

- 도구·패키징 변경 후 `plugins/webapp/`에서 `npm test`로 Claude·Codex·Antigravity 패키지를 모두 확인합니다.
- 스킬·예시 변경 후 `plugins/webapp/`에서 `npm run check`를 실행합니다. 예시의 고정 커밋 링크를 온라인으로 점검할 때는 `npm run check:links`를 실행합니다.
- 커밋·푸시·전역 설치는 사용자가 요청한 범위에서만 합니다. `main` 푸시는 검사 워크플로(`check.yml`)만 돌립니다.

<!-- webapp@dev-goraebap:start -->
## 개발 지침

이 프로젝트는 Webapp 플러그인(0.17.0 이상)의 지침을 따릅니다. 작업을 시작할 때 goraebap-mode를 읽고, 바꾸는 영역의 지침(webapp-project·frontend-engineering·frontend-design-system·frontend-interaction·backend-engineering)을 함께 읽습니다. 아래 프로젝트 규칙이 지침과 다르면 프로젝트 규칙을 따릅니다. Webapp 지침을 읽을 수 없거나 설치된 버전이 위 버전보다 낮으면 추측으로 진행하지 않습니다. 작업 상태를 이어받기 문서로 남기고, 플러그인 설치·갱신 방법과 새 세션에서 읽을 문서 경로를 사용자에게 알립니다.

- Webapp 스택: react
<!-- webapp@dev-goraebap:end -->

## 프로젝트 규칙

지침과 다르게 하는 것은 없습니다.
