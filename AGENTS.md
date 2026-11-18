# dev-goraebap

Webcraft 개발 지침 플러그인과 공식 문서 사이트(goraebap.xyz, 이름 dev.goraebap)를 함께 관리합니다. 지침과 문서는 한국어로 씁니다. Git으로 관리하지 않는 임시 문서는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽으며, 지침의 원본은 이 파일 하나입니다.

## 원본과 작업 범위

- `plugins/webcraft/skills/`는 배포할 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 공식 문서 사이트는 Starlight(Astro) 문서 사이트이고 테마는 `starlight-theme-rapide`입니다. 원문은 `site/src/content/docs/`의 MDX이며, 사이트 첫 화면은 `index.mdx`, 제품 문서는 제품 칸 폴더(`web/`) 아래에 둡니다. 칸과 메뉴는 `site/astro.config.mjs`의 `starlight-sidebar-topics` 설정에서 정합니다. 사이트 코드는 설정(`site/astro.config.mjs`)만 둡니다. 사이트에 디자인 시스템이나 앱 코드를 두지 않습니다. 대표 프론트엔드 코드는 cowork 하나입니다.
- 문서의 코드 조각은 cowork의 특정 커밋에서 그대로 옮기고 코드 블록 제목에 저장소 기준 경로를 적습니다. 옮긴 커밋은 [결정 기록](docs/decisions.md)에 둡니다. 코드를 지어내거나 고쳐 옮기지 않습니다.
- `site/public/r/`는 shadcn 레지스트리 `@webcraft`의 JSON입니다. 직접 고치지 않습니다. 키트 원본은 cowork에 있습니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 사이트 원문·자산은 플러그인 패키지에 포함하지 않습니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webcraft를 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 되돌리기 어려운 결정과 기각한 대안은 [결정 기록](docs/decisions.md)에 남깁니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webcraft/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webcraft/skills/goraebap-mode/references/writer.md)를 따릅니다. 공식 문서는 사용자에게 쓰는 글이라 '해요'체로 씁니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다(글쓰기 기준).

`plugins/webcraft/dist/`는 직접 고치지 않고 `plugins/webcraft/`에서 `npm run package`로 만듭니다. `site/dist/`는 `site/`에서 `npm run build`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webcraft`입니다.

## 검증과 배포

- 도구·패키징 변경 후 `plugins/webcraft/`에서 `npm test`로 Claude·Codex 패키지를 모두 확인합니다.
- 스킬 변경 후 `plugins/webcraft/`에서 `npm run check`를 실행합니다.
- 매뉴얼을 바꾸면 `site/`에서 `npm run build`를 실행하고, `npm run dev`(4451)로 바뀐 페이지를 열어 확인합니다.
- 커밋·푸시·전역 설치·배포는 사용자가 요청한 범위에서만 합니다. 사이트 `goraebap.xyz`는 홈서버가 내보내며 저장소 루트에서 `deploy/site.sh`를 실행해 배포합니다. `deploy/site.sh`는 인자 없이 실행하면 `main`을, `deploy/site.sh <ref>`는 그 브랜치나 커밋을 임시 worktree에 꺼내 빌드하고 홈서버에 올리므로 지금 작업 폴더는 건드리지 않습니다. 홈서버에는 최근 배포 5개가 남고 `deploy/site.sh --rollback`은 바로 전 배포로 되돌립니다. `main` 푸시는 사이트를 배포하지 않으며 검사 워크플로(`check.yml`)만 둡니다.
