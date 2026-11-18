# dev-goraebap

블로그와 Webcraft 가이드 사이트, Webcraft 개발 지침 플러그인을 함께 관리합니다. 지침과 문서는 한국어로 씁니다. Git으로 관리하지 않는 임시 문서는 저장소 밖 `~/tmp/dev.goraebap/`에 둡니다. 로컬 개발 맥락이 필요하면 그 폴더의 `README.md`를 읽습니다. Claude Code는 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 거쳐 이 파일을 읽으며, 지침의 원본은 이 파일 하나입니다.

## 원본과 작업 범위

- `plugins/webcraft/skills/`는 배포할 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 화면 규칙의 원본은 `plugins/webcraft/skills/design-system`의 Markdown입니다. 사이트의 규칙 문서는 이 원본을 그대로 읽고, `client/apps/blog/content/`의 화면 해설은 그 규칙을 풀어 씁니다. 규칙을 바꾸면 스킬을 먼저 고치고 해설을 맞춥니다.
- 블로그 원본은 `client/apps/blog/content/blog/posts/<slug>/index.md`와 옆의 `assets/`입니다. 외부 아키텍처 저장소의 문서는 소유 관계를 바꾸거나 복사하지 않습니다. 글의 뜻과 문체는 별도 요청 없이 고쳐 쓰지 않습니다.
- 사이트는 하나의 React 앱입니다. `client/apps/blog/src/`를 FSD의 `app → pages → widgets → features → entities → shared` 순서로 나누며 필요한 계층만 둡니다. 상위 계층을 하위 계층에서 가져오거나 같은 계층의 다른 슬라이스를 직접 가져오지 않습니다. 슬라이스 외부에서는 공개 진입점을 사용합니다.
- Webcraft 키트(레지스트리 `@webcraft`로 내보내는 부품)는 `client/apps/blog/src/shared/ui/kit/`에 두고, 사이트가 직접 만든 공통 UI는 `client/apps/blog/src/shared/ui/` 바로 아래에 둡니다. 실행 견본은 두지 않습니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 사이트 소스·글·자산은 플러그인 패키지에 포함하지 않습니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webcraft를 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 프론트엔드는 `client/` 아래에 둡니다. `client/package.json`이 npm 워크스페이스이고 앱은 `client/apps/`에 둡니다. `client/apps/blog`는 블로그·가이드 사이트(goraebap.xyz)입니다. 저장소 루트에는 `package.json`을 두지 않습니다. 사이트 명령(`blog:*`)은 `client/`에서, 플러그인 명령은 `plugins/webcraft/`에서 실행합니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webcraft/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webcraft/skills/goraebap-mode/references/writer.md)를 따릅니다. 규칙 설명과 예시에도 같은 문체를 적용합니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다(글쓰기 기준).

`plugins/webcraft/dist/`는 직접 고치지 않고 `plugins/webcraft/`에서 `npm run package`로 만듭니다. `client/apps/blog/dist/`는 `client/`에서 `npm run blog:build`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webcraft`입니다.

## 검증과 배포

- 도구·패키징 변경 후 `plugins/webcraft/`에서 `npm test`로 Claude·Codex 패키지를 모두 확인합니다.
- 스킬 변경 후 `plugins/webcraft/`에서 `npm run check`를 실행합니다.
- 사이트 코드·경로·콘텐츠 변경 후 `client/`에서 `npm run blog:check`, `npm run blog:build`를 실행하고, `client/apps/blog`에서 `npm run check:ui`를 실행합니다.
- UI를 바꾸면 [문구·본문과 검증](plugins/webcraft/skills/design-system/references/content-and-review.md)을 따라 실제 화면에서 데이터 상태·모션·콘텐츠 폭·키보드·데스크톱과 휴대폰·라이트와 다크를 확인합니다. 확인한 것과 못 한 것을 나누어 보고합니다.
- 커밋·푸시·전역 설치·배포는 사용자가 요청한 범위에서만 합니다. 사이트 `goraebap.xyz`는 홈서버가 내보내며 저장소 루트에서 `deploy/blog.sh`를 실행해 배포합니다. `deploy/blog.sh`는 인자 없이 실행하면 `main`을, `deploy/blog.sh <ref>`는 그 브랜치나 커밋을 임시 worktree에 꺼내 빌드하고 홈서버에 올리므로 지금 작업 폴더는 건드리지 않습니다. 홈서버에는 최근 배포 5개가 남고 `deploy/blog.sh --rollback`은 바로 전 배포로 되돌립니다. `main` 푸시는 사이트를 배포하지 않으며 검사 워크플로(`check.yml`)만 둡니다.
