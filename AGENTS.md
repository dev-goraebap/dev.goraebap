# dev-goraebap

Webcraft 개발 지침 플러그인을 관리합니다. 지침과 문서는 한국어로 씁니다. Git으로 관리하지 않는 임시 문서는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽으며, 지침의 원본은 이 파일 하나입니다.

## 원본과 작업 범위

- `plugins/webcraft/skills/`는 배포할 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 대표 코드는 cowork 하나이며 키트 원본도 cowork(`web/src/shared/ui/kit`)입니다. 스킬의 코드 링크는 cowork GitHub의 고정 커밋 주소(`https://github.com/dev-goraebap/cowork/blob/<커밋>/web/...`)로 겁니다. 서브모듈 `examples/cowork`는 그 커밋에 고정하며 읽기 전용입니다. cowork는 cowork 저장소에서 고칩니다. 링크 커밋을 올릴 때는 서브모듈을 같은 커밋으로 올리고, `plugins/webcraft/`에서 `npm run check`로 링크가 가리키는 파일이 있는지 확인합니다. 저장소를 받을 때는 `git clone --recurse-submodules`로 받거나 받은 뒤 `git submodule update --init`을 실행해 서브모듈도 받습니다. 이 방식을 고른 이유는 [결정 기록](docs/decisions.md)에 둡니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webcraft를 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 되돌리기 어려운 결정과 기각한 대안은 [결정 기록](docs/decisions.md)에 남깁니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webcraft/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webcraft/skills/goraebap-mode/references/writer.md)를 따릅니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다(글쓰기 기준).

`plugins/webcraft/dist/`는 직접 고치지 않고 `plugins/webcraft/`에서 `npm run package`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webcraft`입니다.

## 검증과 배포

- 도구·패키징 변경 후 `plugins/webcraft/`에서 `npm test`로 Claude·Codex 패키지를 모두 확인합니다.
- 스킬 변경 후 `plugins/webcraft/`에서 `npm run check`를 실행합니다.
- 커밋·푸시·전역 설치는 사용자가 요청한 범위에서만 합니다. `main` 푸시는 검사 워크플로(`check.yml`)만 돌립니다.
