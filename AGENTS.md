# dev-goraebap

웹 앱 개발 지침 플러그인 **Webapp**(`webapp@dev-goraebap`)을 관리합니다. 지침과 문서는 한국어로 씁니다. Git으로 관리하지 않는 임시 문서는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽으며, 지침의 원본은 이 파일 하나입니다.

## 원본과 작업 범위

- `plugins/webapp/skills/`는 배포할 핵심 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 핵심 지침(`skills/`)은 스택·라이브러리·프로젝트 코드·특정 어댑터 이름 없이 판단 기준과 이유만 쓰며 `plugins/webapp/`의 `npm run check`가 이를 검사합니다.
- 스택과 구현은 프로젝트별 어댑터 `plugins/webapp/adapters/<프로젝트>/`에 두고, 새 어댑터를 더하거나 최신화하는 법은 [어댑터 안내](plugins/webapp/adapters/README.md)를 따릅니다. 어댑터는 공개 오픈소스 프로젝트만 등록하며, 저장소 서브모듈 없이 원본 저장소의 고정 커밋 주소(`https://github.com/<owner>/<repo>/blob/<40자리 커밋>/...`)로 링크합니다. 링크가 살아 있는지 확인할 때는 `plugins/webapp/`에서 `npm run check:links`를 실행합니다. 이 방식을 고른 이유는 [결정 기록](docs/decisions.md)에 둡니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webapp을 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 되돌리기 어려운 결정과 기각한 대안은 [결정 기록](docs/decisions.md)에 남깁니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webapp/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webapp/skills/goraebap-mode/references/writer.md)를 따릅니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다(글쓰기 기준).

`plugins/webapp/dist/`는 직접 고치지 않고 `plugins/webapp/`에서 `npm run package`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webapp`입니다.

## 검증과 배포

- 도구·패키징 변경 후 `plugins/webapp/`에서 `npm test`로 Claude·Codex·Antigravity 패키지를 모두 확인합니다.
- 스킬·어댑터 변경 후 `plugins/webapp/`에서 `npm run check`를 실행합니다. 어댑터 링크를 온라인으로 점검할 때는 `npm run check:links`를 실행합니다.
- 커밋·푸시·전역 설치는 사용자가 요청한 범위에서만 합니다. `main` 푸시는 검사 워크플로(`check.yml`)만 돌립니다.

<!-- webapp@dev-goraebap:start -->
## 개발 지침

이 프로젝트는 Webapp 플러그인(0.15.3 이상)의 지침을 따릅니다. 작업을 시작할 때 goraebap-mode를 읽고, 바꾸는 영역의 지침(frontend·ui-ux·backend·api·database·architecture)을 함께 읽습니다. 아래 프로젝트 규칙이 지침과 다르면 프로젝트 규칙을 따릅니다. Webapp 지침을 읽을 수 없거나 설치된 버전이 위 버전보다 낮으면 추측으로 진행하지 않습니다. 작업 상태를 이어받기 문서로 남기고, 플러그인 설치·갱신 방법과 새 세션에서 읽을 문서 경로를 사용자에게 알립니다.

- Webapp 어댑터: cowork
<!-- webapp@dev-goraebap:end -->

## 프로젝트 규칙

지침과 다르게 하는 것은 없습니다.
