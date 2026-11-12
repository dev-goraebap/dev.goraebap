# dev-goraebap

블로그와 Webcraft 가이드 사이트, Webcraft 개발 지침 플러그인을 함께 관리합니다. 지침과 문서는 한국어로 씁니다. 로컬 개발 맥락이 필요하면 `.local/README.md`를 읽습니다. `.local/`은 Git과 배포에서 제외합니다.

## 원본과 작업 범위

- `plugins/webcraft/skills/`는 배포할 개발 지침의 원본입니다. 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.
- 화면 규칙의 원본은 `plugins/webcraft/skills/design-system`의 Markdown입니다. 사이트의 규칙 문서는 이 원본을 그대로 읽고, `apps/site/content/`의 화면 해설은 그 규칙을 풀어 씁니다. 규칙을 바꾸면 스킬을 먼저 고치고 해설을 맞춥니다.
- 블로그 원본은 `apps/site/content/blog/posts/<slug>/index.md`와 옆의 `assets/`입니다. 외부 아키텍처 저장소의 문서는 소유 관계를 바꾸거나 복사하지 않습니다. 글의 뜻과 문체는 별도 요청 없이 고쳐 쓰지 않습니다.
- 사이트는 하나의 React 앱입니다. `apps/site/src/`를 FSD의 `app → pages → widgets → features → entities → shared` 순서로 나누며 필요한 계층만 둡니다. 상위 계층을 하위 계층에서 가져오거나 같은 계층의 다른 슬라이스를 직접 가져오지 않습니다. 슬라이스 외부에서는 공개 진입점을 사용합니다.
- 공통 UI는 `apps/site/src/shared/ui/`, 실행 견본은 `apps/site/samples/`에 둡니다. 견본은 별도 사이트가 아니라 같은 빌드의 `sample.html`에서 그립니다.
- 플러그인은 `plugins/<이름>/` 아래에서 독립적으로 관리합니다. 사이트 소스·견본·글·자산은 플러그인 패키지에 포함하지 않습니다. 기존 제품은 지침 사본 대신 AGENTS.md로 Webcraft를 가리키며, 제품 고유 예외만 프로젝트 규칙에 둡니다.
- 프론트엔드 앱은 `apps/` 아래에 두고 앱마다 자기 `package.json`과 의존성을 가집니다. `apps/site`는 블로그·가이드 사이트, `apps/demo`는 호호코워크 화면을 shadcn으로 재현한 데모 앱입니다. 데모는 자기 `AGENTS.md`를 따릅니다. 루트 `package.json`은 플러그인 도구와 사이트 명령(`site:*`)의 진입점만 둡니다.

## 문서와 생성물

스킬·참고 자료·문서를 쓰거나 고칠 때는 [글쓰기 기준](plugins/webcraft/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](plugins/webcraft/skills/goraebap-mode/references/writer.md)를 따릅니다. 규칙 설명과 예시에도 같은 문체를 적용합니다.

`plugins/webcraft/dist/`는 직접 고치지 않고 `npm run package:plugins`로 만듭니다. `apps/site/dist/`는 `npm run site:build`로 만듭니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구의 연결 파일이며 생성 배포본을 가리킵니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webcraft`입니다.

## 검증과 배포

- 도구·패키징 변경 후 `npm test`로 Claude·Codex 패키지를 모두 확인합니다.
- 스킬 변경 후 `npm run check`를 실행합니다.
- 사이트 코드·경로·콘텐츠 변경 후 `npm run site:check`, `npm run site:test`, `npm run site:build`를 실행합니다.
- UI를 바꾸면 [문구·본문과 검증](plugins/webcraft/skills/design-system/references/content-and-review.md)을 따라 실제 화면에서 데이터 상태·모션·콘텐츠 폭·키보드·데스크톱과 휴대폰·라이트와 다크를 확인합니다. 확인한 것과 못 한 것을 나누어 보고합니다.
- 커밋·푸시·전역 설치·배포는 사용자가 요청한 범위에서만 합니다. 사이트는 GitHub Pages로 `goraebap.xyz`에 배포합니다. `main` 푸시는 사이트 배포 워크플로를 실행합니다.
